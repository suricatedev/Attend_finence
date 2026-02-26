# Filtros de template para formatação (moeda BRL, etc.)
from django import template

register = template.Library()


def _format_brl(value):
    """Formata número como moeda BRL: R$ 1.234,56 (2 decimais, ponto milhares, vírgula decimal)."""
    if value is None:
        return 'R$ 0,00'
    try:
        num = float(value)
    except (TypeError, ValueError):
        return 'R$ 0,00'
    # Formato brasileiro: 2 decimais, vírgula decimal, ponto milhares
    s = f'{num:,.2f}'
    # Python usa 1,234.56 → trocar para 1.234,56
    parts = s.split('.')
    int_part = parts[0].replace(',', '.')
    dec_part = parts[1] if len(parts) > 1 else '00'
    return f'R$ {int_part},{dec_part}'


@register.filter
def brl(value):
    """Filtro de template: {{ valor|brl }} → R$ 1.234,56"""
    return _format_brl(value)
