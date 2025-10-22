from django.urls import path, include
from . import views

urlpatterns = [
    path("home/", views.receber_dados, name = 'home')
]
