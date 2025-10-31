from django.views import View
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth.models import User, Group

class LoginUsuarios(View):

    def get(self, request):
        return render(request, "usuarios/login/login.html")
    
    def post(self, request):
        # Verificar se os campos existem no POST
        name = request.POST.get("name")
        password = request.POST.get("password")

        if not name or not password:
            return render(request, "usuarios/login/login.html", {
                "erro": "Por favor, preencha todos os campos."
            })

        return LoginUsuarios.autenticacao_usuario(self, request, name, password)

    def autenticacao_usuario(self, request, name, password):    
        try:
            user = authenticate(request, username=name, password=password)

            if user is not None:               
                login(request, user)        
                return redirect('home')   
                          
            else:
                return render(request, "usuarios/login/login.html", {
                    "erro": "Senha ou nome de usuario incorreto"
                })
            
        except Exception as e:
            print(f'Erro ao autenticar usuario: {e}')
            return render(request, "usuarios/login/login.html", {
                "erro": f"Erro ao fazer login: {str(e)}"
            })




class RegisterarUsuario(View):


    def get(self, request):
        return render(request, "login01/forms.html")
    
    def post(self, request):

        self.name_user = request.POST.get("name_user")
        self.password = request.POST.get("password")
        self.first_name = request.POST.get("first_name")
        self.last_name = request.POST.get("last_name")
        self.email = request.POST.get("email")
        self.cargo = request.POST.get("funcao")

        # Validação básica
        if not all([self.name_user, self.password, self.first_name, self.last_name, self.email, self.cargo]):
            messages.error(request, "Todos os campos são obrigatórios!")
            return redirect('gerenciar_usuarios')

        # Verificar se usuário já existe
        if User.objects.filter(username=self.name_user).exists():
            messages.error(request, f"Erro! Usuário '{self.name_user}' já existe.")
            return redirect('gerenciar_usuarios')

        # Criar usuário
        try:
            self.user = User.objects.create_user(
                username=self.name_user,
                password=self.password,
                first_name=self.first_name,
                last_name=self.last_name,
                email=self.email
            )
            
            # Adicionar ao grupo
            try:
                group = Group.objects.get(name=self.cargo)
                self.user.groups.add(group)
            except Group.DoesNotExist:
                messages.warning(request, f"Grupo '{self.cargo}' não encontrado. Usuário criado sem grupo.")
            except Exception as e:
                print(f'Erro ao adicionar {self.name_user} ao grupo: {e}')
                messages.warning(request, f'Usuário criado, mas houve erro ao adicionar ao grupo.')
            
            messages.success(request, f"Usuário '{self.name_user}' criado com sucesso!")
            return redirect('gerenciar_usuarios')
            
        except Exception as e:
            print(f'Erro ao criar usuário: {e}')
            messages.error(request, f"Erro ao cadastrar usuário: {str(e)}")
            return redirect('gerenciar_usuarios')




class LogoutUsuario(View):
    def get(self, request):
        logout(request)
        messages.success(request, 'Você saiu com sucesso!')
        return redirect('login')


class GerenciarUsuarios(View):
    def get(self, request):
        if not request.user.is_authenticated:
            return redirect('login')
        
        # Verificar permissão: apenas Administrador pode gerenciar usuários
        from usuarios.decorators import user_can_manage_users
        if not user_can_manage_users(request.user):
            messages.error(request, 'Você não tem permissão para acessar esta página.')
            return redirect('home')
        
        # Buscar todos os grupos disponíveis para o select
        grupos = Group.objects.all()
        
        return render(request, "usuarios/gerenciar-usuarios.html", {
            'grupos': grupos
        })


class Equipes(View):
    def get(self, request):
        if not request.user.is_authenticated:
            return redirect('login')
        
        # Verificar permissão: apenas Administrador pode ver equipes
        from usuarios.decorators import user_can_view_teams
        if not user_can_view_teams(request.user):
            messages.error(request, 'Você não tem permissão para acessar esta página.')
            return redirect('home')
        
        # Buscar todos os grupos e seus membros
        grupos = Group.objects.all().prefetch_related('user_set')
        
        grupos_com_membros = []
        for grupo in grupos:
            membros = grupo.user_set.all()
            grupos_com_membros.append({
                'grupo': grupo,
                'membros': membros,
                'total_membros': membros.count()
            })
        
        return render(request, "usuarios/equipes.html", {
            'grupos_com_membros': grupos_com_membros
        })




    


