from django import template
from usuarios.decorators import (
    user_can_view_reports,
    user_can_view_dashboard,
    user_can_view_services,
    user_can_manage_users,
    user_can_view_teams,
    user_can_change_status,
    user_can_create_request,
    user_is_admin,
    user_is_financeiro,
    user_is_solicitante
)

register = template.Library()

@register.filter
def can_view_reports(user):
    return user_can_view_reports(user)

@register.filter
def can_view_dashboard(user):
    return user_can_view_dashboard(user)

@register.filter
def can_view_services(user):
    return user_can_view_services(user)

@register.filter
def can_manage_users(user):
    return user_can_manage_users(user)

@register.filter
def can_view_teams(user):
    return user_can_view_teams(user)

@register.filter
def can_change_status(user):
    return user_can_change_status(user)

@register.filter
def can_create_request(user):
    return user_can_create_request(user)

@register.filter
def is_admin(user):
    return user_is_admin(user)

@register.filter
def is_financeiro(user):
    return user_is_financeiro(user)

@register.filter
def currency_br(value):
    """
    Formata um valor numérico como moeda brasileira (R$ 126.342.619,54)
    """
    if value is None:
        return "R$ 0,00"
    
    try:
        # Converter para float se necessário
        valor = float(value)
        
        # Separar parte inteira e decimal
        parte_inteira = int(abs(valor))
        parte_decimal = abs(valor) - parte_inteira
        
        # Formatar parte decimal com 2 dígitos
        parte_decimal_str = f"{parte_decimal:.2f}".split('.')[1]
        
        # Formatar parte inteira com separador de milhar (ponto)
        parte_inteira_str = str(parte_inteira)
        parte_inteira_formatada = ""
        
        # Adicionar pontos a cada 3 dígitos da direita para esquerda
        for i, digito in enumerate(reversed(parte_inteira_str)):
            if i > 0 and i % 3 == 0:
                parte_inteira_formatada = '.' + parte_inteira_formatada
            parte_inteira_formatada = digito + parte_inteira_formatada
        
        # Adicionar sinal negativo se necessário
        sinal = "-" if valor < 0 else ""
        
        # Retornar no formato brasileiro: R$ 126.342.619,54
        return f"{sinal}R$ {parte_inteira_formatada},{parte_decimal_str}"
    except (ValueError, TypeError):
        return "R$ 0,00"

@register.filter
def is_solicitante(user):
    return user_is_solicitante(user)

