from rest_framework import permissions
from usuarios.decorators import user_is_admin


class IsAdminUser(permissions.BasePermission):
    """
    Permissão personalizada que permite acesso apenas para usuários do grupo 'Administrador'
    ou superusuários.
    """
    
    def has_permission(self, request, view):
        """
        Verifica se o usuário tem permissão para acessar a view.
        Retorna True apenas se o usuário for do grupo 'Administrador' ou superuser.
        """
        # Verifica se o usuário está autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verifica se é superuser ou pertence ao grupo Administrador
        return user_is_admin(request.user)








from usuarios.decorators import user_is_admin


class IsAdminUser(permissions.BasePermission):
    """
    Permissão personalizada que permite acesso apenas para usuários do grupo 'Administrador'
    ou superusuários.
    """
    
    def has_permission(self, request, view):
        """
        Verifica se o usuário tem permissão para acessar a view.
        Retorna True apenas se o usuário for do grupo 'Administrador' ou superuser.
        """
        # Verifica se o usuário está autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verifica se é superuser ou pertence ao grupo Administrador
        return user_is_admin(request.user)







