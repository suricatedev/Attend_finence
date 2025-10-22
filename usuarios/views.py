from django.views import View
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.shortcuts import render, redirect

class LoginUsuarios(View):

    def get(self, request):
        return render(request, "login01/index2.html")
    
    def post(self, request):
        email = request.POST["email"]
        password = request.POST["password"]

    


