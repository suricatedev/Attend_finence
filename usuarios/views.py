from django.views import View
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth.models import User, Group

class LoginUsuarios(View):

    def get(self, request):
        return render(request, "login01/index2.html")
    
    def post(self, request):
        self.name = request.POST["name"]
        self.password = request.POST["password"]

        return LoginUsuarios.autenticacao_usuario(self,request)


    def autenticacao_usuario(self, request):    
        user = authenticate(request,username=self.name, password=self.password)

        try:
            if user is not None:               
                login(request, user)        
                return redirect('home')   
                          
            else:
                return render(request, "login01/index2.html", {"erro":"Senha ou nome de usuario incorreto"})
            
        except Exception as e:
            print(f'Erro ao autenticar usuario: {e}')




class RegisterarUsuario(View):


    def get(self, request):
        return render(request, "login01/forms.html")
    
    def post(self, request):

        self.name_user = request.POST["name_user"]
        self.password = request.POST["password"]
        self.first_name = request.POST["first_name"]
        self.last_name = request.POST["last_name"]
        self.email = request.POST["email"]
        self.cargo = request.POST["funcao"]


        http_status = self.verificacao(request)
        if  http_status.status_code == 401:
            messages.error(request, f"Erro! Usuario: {self.name_user} já existe.")
            return render(request, "login01/forms.html", status=401)
        

        elif http_status.status_code == 200:
            self.cadastar_usuarios(request)
            self.adicionar_grupo(request)

            messages.success(request,"Usuario criado com sucesso!")
            return render(request, "login01/forms.html")


    def verificacao(self, request): 
            user = User.objects.filter(username=self.name_user).exists()
            if user:
                return render(request, "login01/forms.html", status=401)
            else:
                return render(request, "login01/forms.html", status=200)
                       

    def cadastar_usuarios(self,request):

        try:
            self.user = User.objects.create_user(
                username = self.name_user,
                password = self.password,
                first_name = self.first_name,
                last_name = self.last_name,
                email = self.email
            )

        except Exception as e:
            print(f'{e}\n\nErro ao criar o usuario:{self.name_user}')
            messages.error(request, f"Erro ao cadastrar {self.name_user}")
            return render(request, "login01/forms.html")



    def adicionar_grupo(self,request):

        try:
            group = Group.objects.get(name=self.cargo)
            self.user.groups.add(group)

        except Exception as e:
            print(f'{e}\n\nErro ao adicionar {self.name_user} ao grupo: {group}.')
            messages.error(request, f'Erro ao adicionar {self.name_user} ao cargo de {self.cargo}.')
            return render(request, "login01/forms.html" )




    


