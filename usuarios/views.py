from django.views import View
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.shortcuts import render, redirect

class LoginUsuarios(View):

    def get(request):
        return render(request, "login.html")
    
    def post(request):
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            redirect("/")
