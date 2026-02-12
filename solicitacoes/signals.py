from django.apps import apps
from django.contrib.auth.models import AnonymousUser
from django.db.models.signals import post_save, pre_delete, pre_save

from .audit_utils import get_current_request, pop_old_state, serialize_instance, set_old_state
from .models import AuditoriaLog


TARGET_APP_LABELS = {'solicitacoes', 'servicos', 'usuarios', 'dashborads', 'auth'}
EXCLUDED_MODEL_NAMES = {'auditorialog', 'session', 'logentry'}
SENSITIVE_FIELDS = {'password'}


def _should_log(model):
    if model._meta.app_label not in TARGET_APP_LABELS:
        return False
    if model._meta.model_name in EXCLUDED_MODEL_NAMES:
        return False
    return True


def _get_request_context():
    request = get_current_request()
    if not request:
        return None, None, None, None
    user = request.user if request.user and not isinstance(request.user, AnonymousUser) else None
    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    origem = request.path
    return user, ip_address, user_agent, origem


def _get_state_key(instance):
    return f"{instance._meta.label}:{instance.pk}"


def auditoria_pre_save(sender, instance, **kwargs):
    if not _should_log(sender):
        return
    if not instance.pk:
        return
    try:
        # Buscar a versão atual do banco para comparar depois
        original = sender.objects.filter(pk=instance.pk).first()
        if not original:
            return
        old_data = serialize_instance(original, sensitive_fields=SENSITIVE_FIELDS)
        set_old_state(_get_state_key(instance), old_data)
    except Exception:
        pass


def auditoria_post_save(sender, instance, created, **kwargs):
    if not _should_log(sender):
        return
    
    try:
        user, ip_address, user_agent, origem = _get_request_context()
        new_data = serialize_instance(instance, sensitive_fields=SENSITIVE_FIELDS)
        
        acao = 'create' if created else 'update'
        old_data = None
        campos_alterados = None

        if not created:
            state_key = _get_state_key(instance)
            old_data = pop_old_state(state_key) or {}
            campos_alterados = []
            
            # Comparar campos para ver o que mudou
            for key, new_value in new_data.items():
                if old_data.get(key) != new_value:
                    campos_alterados.append(key)
            
            # Se nada mudou, não registra log de update
            if not campos_alterados:
                return
        else:
            # Para criação, todos os campos são "alterados"
            campos_alterados = list(new_data.keys())

        # Criar o log de auditoria
        AuditoriaLog.objects.create(
            app=instance._meta.app_label,
            modelo=instance._meta.model_name,
            objeto_id=str(instance.pk),
            acao=acao,
            usuario=user,
            dados_anteriores=old_data,
            dados_novos=new_data if acao != 'delete' else None,
            campos_alterados=campos_alterados,
            ip_address=ip_address,
            user_agent=user_agent,
            origem=origem,
        )
    except Exception as e:
        print(f"❌ Erro na auditoria (post_save): {str(e)}")


def auditoria_pre_delete(sender, instance, **kwargs):
    if not _should_log(sender):
        return
    try:
        user, ip_address, user_agent, origem = _get_request_context()
        old_data = serialize_instance(instance, sensitive_fields=SENSITIVE_FIELDS)
        AuditoriaLog.objects.create(
            app=instance._meta.app_label,
            modelo=instance._meta.model_name,
            objeto_id=str(instance.pk),
            acao='delete',
            usuario=user,
            dados_anteriores=old_data,
            dados_novos=None,
            campos_alterados=list(old_data.keys()),
            ip_address=ip_address,
            user_agent=user_agent,
            origem=origem,
        )
    except Exception as e:
        print(f"❌ Erro na auditoria (pre_delete): {str(e)}")


def connect_auditoria_signals():
    for model in apps.get_models():
        if _should_log(model):
            # Usar dispatch_uid para evitar conexões duplicadas
            pre_save.connect(
                auditoria_pre_save,
                sender=model,
                weak=False,
                dispatch_uid=f'auditoria_pre_save_{model._meta.label}',
            )
            post_save.connect(
                auditoria_post_save,
                sender=model,
                weak=False,
                dispatch_uid=f'auditoria_post_save_{model._meta.label}',
            )
            pre_delete.connect(
                auditoria_pre_delete,
                sender=model,
                weak=False,
                dispatch_uid=f'auditoria_pre_delete_{model._meta.label}',
            )


# Conectar os signals
connect_auditoria_signals()
