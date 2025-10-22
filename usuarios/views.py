from django.views import View
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth.models import User

class LoginUsuarios(View):

    def get(self, request):
        return render(request, "login01/index2.html")
    
    def post(self, request):
        self.name = request.POST["name"]
        self.password = request.POST["password"]

        return LoginUsuarios.autenticacao_usuario(self,request)



    def autenticacao_usuario(self, request):
      

        user = authenticate(request,username=self.name, password=self.password)
        print("ok")

        try:
            if user is not None:
                
                login(request, user)
                print("Ok")
                return redirect('home')
            
            else:
                return render(request, "login01/index2.html", {"erro":"Erro"})
            
        except Exception as e:
            print(f'Erro ao autenticar usuario: {e}')





    


