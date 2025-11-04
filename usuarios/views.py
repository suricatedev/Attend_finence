from django.views import View
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User, Group
from django.http import JsonResponse

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
        self.cargo = request.POST.get("funcao")  # Mantido para compatibilidade
        
        # Validação básica (grupos podem ser múltiplos, então não exigir cargo)
        if not all([self.name_user, self.password, self.first_name, self.last_name, self.email]):
            messages.error(request, "Todos os campos são obrigatórios!")
            return redirect('gerenciar_usuarios')

        # Verificar se usuário já existe
        if User.objects.filter(username=self.name_user).exists():
            messages.error(request, f"Erro! Usuário '{self.name_user}' já existe.")
            return redirect('gerenciar_usuarios')

        # Validar senha
        if len(self.password) < 6:
            messages.error(request, 'A senha deve ter pelo menos 6 caracteres.')
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
            
            # Adicionar aos grupos (suporta múltiplos grupos agora)
            grupos_selecionados = request.POST.getlist('grupos', [])
            if not grupos_selecionados and self.cargo:
                # Fallback para compatibilidade com campo único 'funcao'
                grupos_selecionados = [self.cargo]
            
            grupos_adicionados = 0
            for grupo_nome in grupos_selecionados:
                try:
                    group = Group.objects.get(name=grupo_nome)
                    self.user.groups.add(group)
                    grupos_adicionados += 1
                except Group.DoesNotExist:
                    print(f'Grupo "{grupo_nome}" não encontrado.')
            
            if grupos_adicionados == 0:
                messages.warning(request, f'Usuário criado, mas nenhum grupo válido foi atribuído.')
            else:
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
        
        # Buscar todos os usuários com seus grupos
        usuarios = User.objects.all().select_related().prefetch_related('groups').order_by('-date_joined')
        
        # Buscar todos os grupos disponíveis para o select
        grupos = Group.objects.all()
        
        # Preparar dados dos usuários
        usuarios_data = []
        for usuario in usuarios:
            grupos_usuario = usuario.groups.all()
            usuarios_data.append({
                'usuario': usuario,
                'grupos': grupos_usuario,
                'total_grupos': grupos_usuario.count()
            })
        
        return render(request, "usuarios/gerenciar-usuarios.html", {
            'usuarios_data': usuarios_data,
            'grupos': grupos,
            'total_usuarios': usuarios.count()
        })


class GetUsuario(View):
    def get(self, request, user_id):
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
        
        from usuarios.decorators import user_can_manage_users
        if not user_can_manage_users(request.user):
            return JsonResponse({'success': False, 'error': 'Sem permissão'}, status=403)
        
        try:
            usuario = User.objects.get(id=user_id)
            grupos = usuario.groups.values_list('name', flat=True)
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': usuario.id,
                    'username': usuario.username,
                    'first_name': usuario.first_name,
                    'last_name': usuario.last_name,
                    'email': usuario.email,
                    'grupos': list(grupos)
                }
            })
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Usuário não encontrado'}, status=404)


class EditarUsuario(View):
    def post(self, request, user_id):
        if not request.user.is_authenticated:
            return redirect('login')
        
        from usuarios.decorators import user_can_manage_users
        if not user_can_manage_users(request.user):
            messages.error(request, 'Você não tem permissão para esta ação.')
            return redirect('gerenciar_usuarios')
        
        try:
            usuario = User.objects.get(id=user_id)
            
            # Atualizar dados básicos (username não pode ser alterado)
            usuario.first_name = request.POST.get('first_name', '')
            usuario.last_name = request.POST.get('last_name', '')
            usuario.email = request.POST.get('email', '')
            
            # Atualizar senha se fornecida e não estiver vazia
            nova_senha = request.POST.get('password', '').strip()
            if nova_senha:
                if len(nova_senha) < 6:
                    messages.error(request, 'A senha deve ter pelo menos 6 caracteres.')
                    return redirect('gerenciar_usuarios')
                usuario.set_password(nova_senha)
            
            usuario.save()
            
            # Atualizar grupos
            grupos_selecionados = request.POST.getlist('grupos', [])
            usuario.groups.clear()
            
            for grupo_nome in grupos_selecionados:
                try:
                    grupo = Group.objects.get(name=grupo_nome)
                    usuario.groups.add(grupo)
                except Group.DoesNotExist:
                    pass
            
            messages.success(request, f"Usuário '{usuario.username}' atualizado com sucesso!")
            return redirect('gerenciar_usuarios')
            
        except User.DoesNotExist:
            messages.error(request, 'Usuário não encontrado.')
            return redirect('gerenciar_usuarios')
        except Exception as e:
            print(f'Erro ao editar usuário: {e}')
            messages.error(request, f"Erro ao atualizar usuário: {str(e)}")
            return redirect('gerenciar_usuarios')


class DeletarUsuario(View):
    def post(self, request, user_id):
        if not request.user.is_authenticated:
            return redirect('login')
        
        from usuarios.decorators import user_can_manage_users
        if not user_can_manage_users(request.user):
            messages.error(request, 'Você não tem permissão para esta ação.')
            return redirect('gerenciar_usuarios')
        
        try:
            usuario = User.objects.get(id=user_id)
            
            # Não permitir deletar o próprio usuário
            if usuario.id == request.user.id:
                messages.error(request, 'Você não pode deletar seu próprio usuário.')
                return redirect('gerenciar_usuarios')
            
            username = usuario.username
            usuario.delete()
            messages.success(request, f"Usuário '{username}' deletado com sucesso!")
            return redirect('gerenciar_usuarios')
            
        except User.DoesNotExist:
            messages.error(request, 'Usuário não encontrado.')
            return redirect('gerenciar_usuarios')
        except Exception as e:
            print(f'Erro ao deletar usuário: {e}')
            messages.error(request, f"Erro ao deletar usuário: {str(e)}")
            return redirect('gerenciar_usuarios')

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




    
