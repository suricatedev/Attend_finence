from django.contrib import admin
from .models import PasswordResetToken

# Register your models here.

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'email', 'code', 'created_at', 'expires_at', 'used', 'is_valid')
    list_filter = ('used', 'created_at', 'expires_at')
    search_fields = ('email', 'user__username', 'code')
    readonly_fields = ('code', 'created_at')
    
    def is_valid(self, obj):
        return obj.is_valid()
    is_valid.boolean = True
    is_valid.short_description = 'Válido'
