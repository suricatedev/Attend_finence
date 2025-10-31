from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages

def group_required(*group_names):
    """
    Decorator para verificar se o usuário pertence a algum dos grupos especificados.
    Uso: @group_required('Administrador', 'Financeiro')
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                messages.error(request, 'Você precisa estar autenticado para acessar esta página.')
                return redirect('login')
            
            # Verificar se o usuário pertence a algum dos grupos
            user_groups = request.user.groups.values_list('name', flat=True)
            
            if not any(group in user_groups for group in group_names):
                messages.error(request, 'Você não tem permissão para acessar esta página.')
                return redirect('home')
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

def user_has_group(user, *group_names):
    """
    Helper function para verificar se o usuário pertence a algum dos grupos.
    Retorna True se o usuário pertence a pelo menos um dos grupos.
    """
    if not user.is_authenticated:
        return False
    
    user_groups = user.groups.values_list('name', flat=True)
    return any(group in user_groups for group in group_names)

def user_is_admin(user):
    """Verifica se o usuário é administrador."""
    return user_has_group(user, 'Administrador') or user.is_superuser

def user_is_financeiro(user):
    """Verifica se o usuário é do grupo Financeiro."""
    return user_has_group(user, 'Financeiro')

def user_is_solicitante(user):
    """Verifica se o usuário é do grupo Solicitante."""
    return user_has_group(user, 'Solicitante')

def user_can_manage_users(user):
    """Verifica se o usuário pode gerenciar usuários (Admin e Financeiro)."""
    return user_is_admin(user) or user_is_financeiro(user)

def user_can_view_services(user):
    """Verifica se o usuário pode ver serviços (Admin e Financeiro)."""
    return user_is_admin(user) or user_is_financeiro(user)

def user_can_view_dashboard(user):
    """Verifica se o usuário pode ver dashboard (Admin e Financeiro)."""
    return user_is_admin(user) or user_is_financeiro(user)

def user_can_view_teams(user):
    """Verifica se o usuário pode ver equipes (Admin e Financeiro)."""
    return user_is_admin(user) or user_is_financeiro(user)

def user_can_change_status(user):
    """Verifica se o usuário pode mudar status de solicitações (Financeiro e Admin)."""
    return user_is_admin(user) or user_is_financeiro(user)

def user_can_create_request(user):
    """Verifica se o usuário pode criar solicitações (Solicitante, Financeiro e Admin)."""
    return user_is_admin(user) or user_is_financeiro(user) or user_is_solicitante(user)

def user_can_view_reports(user):
    """Verifica se o usuário pode ver relatórios (Solicitante, Financeiro e Admin)."""
    return user_is_admin(user) or user_is_financeiro(user) or user_is_solicitante(user)

