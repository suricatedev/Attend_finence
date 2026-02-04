import datetime
import threading
from decimal import Decimal

from django.db.models import Model
from django.db.models.query import QuerySet
from django.forms.models import model_to_dict
from django.utils.functional import LazyObject, empty


_local = threading.local()


def set_current_request(request):
    _local.request = request


def get_current_request():
    return getattr(_local, 'request', None)


def _get_old_states():
    old_states = getattr(_local, 'old_states', None)
    if old_states is None:
        old_states = {}
        _local.old_states = old_states
    return old_states


def set_old_state(key, value):
    _get_old_states()[key] = value


def pop_old_state(key):
    return _get_old_states().pop(key, None)


def serialize_value(value):
    if isinstance(value, LazyObject):
        value = None if value._wrapped is empty else value._wrapped
    if isinstance(value, datetime.datetime):
        return value.isoformat()
    if isinstance(value, datetime.date):
        return value.isoformat()
    if isinstance(value, datetime.time):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, Model):
        return value.pk
    if isinstance(value, QuerySet):
        return [obj.pk for obj in value]
    if isinstance(value, (list, tuple, set)):
        return [serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_value(val) for key, val in value.items()}
    if hasattr(value, 'name') and hasattr(value, 'path'):
        return value.name
    return value


def serialize_instance(instance, fields=None, sensitive_fields=None):
    data = model_to_dict(instance, fields=fields)
    if sensitive_fields:
        for field in sensitive_fields:
            if field in data and data[field] not in (None, ''):
                data[field] = '***'
    for key, value in data.items():
        data[key] = serialize_value(value)
    return data
