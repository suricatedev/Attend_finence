from pathlib import Path
from decouple import config 



# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# CSRF: confiar nos domínios usados em produção
CSRF_TRUSTED_ORIGINS = [
    "https://attfman.attendservice.com.br",
    "http://attfman.attendservice.com.br",
    "https://www.attfman.attendservice.com.br",
    "http://www.attfman.attendservice.com.br",
    "https://*.attendservice.com.br",
    "http://*.attendservice.com.br",
]

# Se houver proxy/SSL na frente, garanta que o Django reconheça HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'solicitacoes.apps.SolicitacoesConfig',
    'usuarios',
    'dashborads',
    'servicos',
    'crm.apps.CrmConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'solicitacoes.middleware.AuditoriaMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'attend_finence.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates/'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'servicos.context_processors.servicos_context',
                'solicitacoes.context_processors.recebedores_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'attend_finence.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static'
]

# Diretório onde os arquivos estáticos serão coletados para produção
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Garantir que arquivos de vídeo sejam incluídos no collectstatic
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configurações de Sessão e Segurança
SESSION_COOKIE_NAME = 'attend_finance_session_v2'  # Nome exclusivo para evitar conflitos
SESSION_COOKIE_AGE = 86400  # 24 horas em segundos
SESSION_SAVE_EVERY_REQUEST = True  # Renova a sessão a cada requisição
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Mantém a sessão se fechar o navegador
SESSION_COOKIE_HTTPONLY = True  # Segurança extra contra JS malicioso
SESSION_COOKIE_SAMESITE = 'Lax'  # Essencial para HTTP puro (sem HTTPS)
SESSION_COOKIE_SECURE = False  # Obrigatório False já que não usa HTTPS
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Força persistência no banco de dados
CSRF_COOKIE_AGE = 86400  # Token CSRF dura o mesmo que a sessão
CSRF_USE_SESSIONS = False  # Mantém o token no cookie
CSRF_COOKIE_SECURE = False  # Obrigatório False para HTTP

# Configurações de Email
# Se EMAIL_HOST_USER não estiver configurado, usa console backend para desenvolvimento
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    # Configurações de produção (quando email está configurado)
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)
    pass  # Email SMTP configurado para envio real
else:
    # Modo desenvolvimento: emails são exibidos no console
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'noreply@attendfinance.com'


# Configuração de Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'app.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'solicitacoes': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'crm': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'servicos': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


# Configurações do Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}


# Limites de upload de arquivos (10MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
