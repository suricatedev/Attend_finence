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
def is_solicitante(user):
    return user_is_solicitante(user)

