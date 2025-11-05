from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets
import string

# Create your models here.

class PasswordResetToken(models.Model):
    """Modelo para armazenar tokens de recuperação de senha"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    code = models.CharField(max_length=6, verbose_name="Código de Verificação")
    email = models.EmailField(verbose_name="Email")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    expires_at = models.DateTimeField(verbose_name="Data de Expiração")
    used = models.BooleanField(default=False, verbose_name="Usado")
    
    class Meta:
        verbose_name = "Token de Recuperação de Senha"
        verbose_name_plural = "Tokens de Recuperação de Senha"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token para {self.email} - {self.code}"
    
    @staticmethod
    def generate_code():
        """Gera um código de 6 dígitos"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    def is_valid(self):
        """Verifica se o token ainda é válido"""
        return not self.used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        """Marca o token como usado"""
        self.used = True
        self.save()
