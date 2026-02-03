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
        original = sender.objects.filter(pk=instance.pk).first()
        if not original:
            return
        old_data = serialize_instance(original, sensitive_fields=SENSITIVE_FIELDS)
        set_old_state(_get_state_key(instance), old_data)
    except Exception:
        return


def auditoria_post_save(sender, instance, created, **kwargs):
    if not _should_log(sender):
        return
    try:
        user, ip_address, user_agent, origem = _get_request_context()
        new_data = serialize_instance(instance, sensitive_fields=SENSITIVE_FIELDS)

        if created:
            AuditoriaLog.objects.create(
                app=instance._meta.app_label,
                modelo=instance._meta.model_name,
                objeto_id=str(instance.pk),
                acao='create',
                usuario=user,
                dados_anteriores=None,
                dados_novos=new_data,
                campos_alterados=list(new_data.keys()),
                ip_address=ip_address,
                user_agent=user_agent,
                origem=origem,
            )
            return

        old_data = pop_old_state(_get_state_key(instance)) or {}
        campos_alterados = []
        for key, new_value in new_data.items():
            if old_data.get(key) != new_value:
                campos_alterados.append(key)

        if not campos_alterados:
            return

        AuditoriaLog.objects.create(
            app=instance._meta.app_label,
            modelo=instance._meta.model_name,
            objeto_id=str(instance.pk),
            acao='update',
            usuario=user,
            dados_anteriores=old_data,
            dados_novos=new_data,
            campos_alterados=campos_alterados,
            ip_address=ip_address,
            user_agent=user_agent,
            origem=origem,
        )
    except Exception:
        return


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
    except Exception:
        return


def connect_auditoria_signals():
    for model in apps.get_models():
        if _should_log(model):
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


connect_auditoria_signals()
