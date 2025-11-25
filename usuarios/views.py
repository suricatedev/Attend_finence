from django.views import View
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User, Group
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import url_has_allowed_host_and_scheme
from .models import PasswordResetToken
import re

class LoginUsuarios(View):

    def get(self, request):
        next_url = request.GET.get('next', '')
        return render(request, "usuarios/login/login.html", {"next": next_url})
    
    def post(self, request):
        # Verificar se os campos existem no POST
        name_raw = request.POST.get("name", "")
        password_raw = request.POST.get("password", "")
        next_url = request.POST.get("next", "")

        # Validação de segurança: verificar se os campos estão preenchidos
        if not name_raw or not password_raw:
            return render(request, "usuarios/login/login.html", {
                "erro": "Por favor, preencha todos os campos.",
                "next": next_url
            })
        
        # Validação de segurança: limitar tamanho dos dados recebidos
        # Django User model tem limite de 150 caracteres para username
        MAX_USERNAME_LENGTH = 150
        MAX_PASSWORD_LENGTH = 128  # Limite seguro para senha
        
        # Sanitizar e validar username
        name = name_raw.strip()
        if len(name) > MAX_USERNAME_LENGTH:
            return render(request, "usuarios/login/login.html", {
                "erro": f"O nome de usuário não pode ter mais de {MAX_USERNAME_LENGTH} caracteres.",
                "next": next_url
            })
        
        if len(name) == 0:
            return render(request, "usuarios/login/login.html", {
                "erro": "Por favor, preencha o nome de usuário.",
                "next": next_url
            })
        
        # Validar senha
        if len(password_raw) > MAX_PASSWORD_LENGTH:
            return render(request, "usuarios/login/login.html", {
                "erro": f"A senha não pode ter mais de {MAX_PASSWORD_LENGTH} caracteres.",
                "next": next_url
            })
        
        if len(password_raw) == 0:
            return render(request, "usuarios/login/login.html", {
                "erro": "Por favor, preencha a senha.",
                "next": next_url
            })
        
        # Sanitização adicional: remover caracteres de controle e espaços extras
        # Manter apenas caracteres alfanuméricos e alguns especiais permitidos
        # Permitir apenas letras, números e caracteres especiais comuns para username
        name_sanitized = re.sub(r'[^\w@.+-]', '', name)
        if name_sanitized != name:
            # Se houve alteração, usar a versão sanitizada mas manter o original para validação
            name = name_sanitized
        
        # Limitar tamanho após sanitização
        name = name[:MAX_USERNAME_LENGTH]
        password = password_raw[:MAX_PASSWORD_LENGTH]

        return LoginUsuarios.autenticacao_usuario(self, request, name, password, next_url)

    def autenticacao_usuario(self, request, name, password, next_url):    
        try:
            user = authenticate(request, username=name, password=password)

            if user is not None:               
                login(request, user)        
                if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}, require_https=request.is_secure()):
                    return redirect(next_url)
                return redirect('home')   
                          
            else:
                return render(request, "usuarios/login/login.html", {
                    "erro": "Senha ou nome de usuario incorreto",
                    "next": next_url
                })
            
        except Exception as e:
            print(f'Erro ao autenticar usuario: {e}')
            return render(request, "usuarios/login/login.html", {
                "erro": f"Erro ao fazer login: {str(e)}",
                "next": next_url
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


class SolicitarRecuperacaoSenha(View):
    """View para solicitar recuperação de senha"""
    
    def get(self, request):
        return render(request, "usuarios/login/recuperar-senha.html")
    
    def post(self, request):
        email = request.POST.get('email', '').strip().lower()
        
        if not email:
            messages.error(request, 'Por favor, informe o email cadastrado.')
            return render(request, "usuarios/login/recuperar-senha.html")
        
        try:
            # Verificar se o email existe no sistema
            user = User.objects.get(email__iexact=email)
            
            # Gerar código de verificação
            code = PasswordResetToken.generate_code()
            expires_at = timezone.now() + timedelta(minutes=15)  # Código válido por 15 minutos
            
            # Invalidar apenas tokens anteriores que ainda não foram validados (não usados)
            # Mantém tokens que já foram validados mas ainda não completaram a redefinição
            PasswordResetToken.objects.filter(
                user=user, 
                used=False,
                expires_at__gt=timezone.now()  # Apenas os que ainda não expiraram
            ).update(used=True)
            
            # Criar novo token
            token = PasswordResetToken.objects.create(
                user=user,
                code=code,
                email=email,
                expires_at=expires_at
            )
            
            # Enviar email com o código
            try:
                subject = 'Código de Verificação - Recuperação de Senha'
                message = f'''
Olá {user.get_full_name() or user.username},

Você solicitou a recuperação de senha no sistema Attend Finance.

Seu código de verificação é: {code}

Este código é válido por 15 minutos.

Se você não solicitou esta recuperação de senha, ignore este email.

Atenciosamente,
Equipe Attend Finance
'''
                from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@attendfinance.com')
                
                # Verificar se email está configurado
                email_backend = getattr(settings, 'EMAIL_BACKEND', '')
                is_console_backend = 'console' in email_backend.lower()
                
                try:
                    send_mail(
                        subject,
                        message,
                        from_email,
                        [email],
                        fail_silently=False,
                    )
                    
                    # Armazenar email na sessão para próxima etapa
                    request.session['password_reset_email'] = email
                    
                    if is_console_backend:
                        # Em modo desenvolvimento, informar que o código está no console (SEM mostrar o código na tela)
                        messages.warning(
                            request, 
                            '⚠️ Email não configurado. O código foi gerado e está no console do servidor Django. '
                            'Para receber por email, configure as variáveis EMAIL_* no arquivo .env (veja CONFIGURAR_EMAIL.md)'
                        )
                        print('\n' + '='*70)
                        print('📧 CÓDIGO DE RECUPERAÇÃO DE SENHA')
                        print('='*70)
                        print(f'Email solicitado: {email}')
                        print(f'Usuário: {user.username}')
                        print(f'Código de verificação: {code}')
                        print(f'Válido por: 15 minutos')
                        print(f'Data/Hora: {timezone.now().strftime("%d/%m/%Y %H:%M:%S")}')
                        print('='*70)
                        print('⚠️  ATENÇÃO: Configure o email no arquivo .env para receber códigos por email')
                        print('='*70 + '\n')
                    else:
                        messages.success(request, f'✅ Código de verificação enviado para {email}. Verifique sua caixa de entrada (e spam, se necessário).')
                    
                    return redirect('validar_codigo_recuperacao')
                    
                except Exception as email_error:
                    # Erro específico ao enviar email
                    error_message = str(email_error)
                    print(f'❌ Erro detalhado ao enviar email: {error_message}')
                    
                    # Mensagens de erro mais específicas
                    if 'authentication failed' in error_message.lower() or '535' in error_message:
                        error_msg = 'Erro de autenticação no servidor de email. Verifique as credenciais no arquivo .env'
                    elif 'connection' in error_message.lower() or 'timeout' in error_message.lower():
                        error_msg = 'Erro de conexão com o servidor de email. Verifique sua conexão com a internet.'
                    elif 'smtp' in error_message.lower():
                        error_msg = f'Erro no servidor SMTP: {error_message}'
                    else:
                        error_msg = f'Erro ao enviar email: {error_message}'
                    
                    messages.error(request, error_msg)
                    return render(request, "usuarios/login/recuperar-senha.html")
                
            except Exception as e:
                print(f'❌ Erro geral ao processar envio de email: {e}')
                import traceback
                traceback.print_exc()
                messages.error(request, f'Erro ao processar solicitação: {str(e)}')
                return render(request, "usuarios/login/recuperar-senha.html")
                
        except User.DoesNotExist:
            # Por segurança, não informar se o email existe ou não
            messages.success(request, 'Se o email estiver cadastrado, você receberá um código de verificação.')
            return render(request, "usuarios/login/recuperar-senha.html")
        except Exception as e:
            print(f'Erro ao solicitar recuperação: {e}')
            messages.error(request, 'Erro ao processar solicitação. Tente novamente.')
            return render(request, "usuarios/login/recuperar-senha.html")


class ValidarCodigoRecuperacao(View):
    """View para validar o código de verificação"""
    
    def get(self, request):
        email = request.session.get('password_reset_email')
        if not email:
            messages.error(request, 'Sessão expirada. Por favor, solicite um novo código.')
            return redirect('solicitar_recuperacao_senha')
        
        return render(request, "usuarios/login/validar-codigo.html", {'email': email})
    
    def post(self, request):
        email = request.session.get('password_reset_email')
        if not email:
            messages.error(request, 'Sessão expirada. Por favor, solicite um novo código.')
            return redirect('solicitar_recuperacao_senha')
        
        code = request.POST.get('code', '').strip()
        
        if not code or len(code) != 6:
            messages.error(request, 'Por favor, informe o código de 6 dígitos.')
            return render(request, "usuarios/login/validar-codigo.html", {'email': email})
        
        try:
            user = User.objects.get(email__iexact=email)
            
            # Buscar token válido
            token = PasswordResetToken.objects.filter(
                user=user,
                code=code,
                email__iexact=email,
                used=False
            ).order_by('-created_at').first()
            
            if not token or not token.is_valid():
                messages.error(request, 'Código inválido ou expirado. Solicite um novo código.')
                return render(request, "usuarios/login/validar-codigo.html", {'email': email})
            
            # Armazenar token_id na sessão para próxima etapa (ANTES de marcar como usado)
            # Isso permite que o token seja verificado na próxima etapa
            request.session['password_reset_token_id'] = token.id
            request.session['password_reset_user_id'] = user.id
            request.session['password_reset_code_validated'] = True  # Flag para indicar que código foi validado
            
            # NÃO marcar como usado ainda - será marcado apenas após redefinir a senha
            # Isso evita que o usuário fique preso se houver algum problema na próxima etapa
            
            messages.success(request, 'Código validado com sucesso! Agora defina sua nova senha.')
            return redirect('redefinir_senha')
            
        except User.DoesNotExist:
            messages.error(request, 'Usuário não encontrado.')
            return redirect('solicitar_recuperacao_senha')
        except Exception as e:
            print(f'Erro ao validar código: {e}')
            messages.error(request, 'Erro ao validar código. Tente novamente.')
            return render(request, "usuarios/login/validar-codigo.html", {'email': email})


class RedefinirSenha(View):
    """View para redefinir a senha após validação do código"""
    
    def get(self, request):
        token_id = request.session.get('password_reset_token_id')
        user_id = request.session.get('password_reset_user_id')
        code_validated = request.session.get('password_reset_code_validated', False)
        
        if not token_id or not user_id:
            messages.error(request, 'Sessão expirada. Por favor, inicie o processo novamente.')
            return redirect('solicitar_recuperacao_senha')
        
        if not code_validated:
            messages.error(request, 'Código não foi validado. Por favor, valide o código primeiro.')
            return redirect('validar_codigo_recuperacao')
        
        try:
            token = PasswordResetToken.objects.get(id=token_id, user_id=user_id)
            if not token.is_valid():
                messages.error(request, 'Código expirado. Solicite um novo código.')
                # Limpar sessão
                request.session.pop('password_reset_token_id', None)
                request.session.pop('password_reset_user_id', None)
                request.session.pop('password_reset_code_validated', None)
                return redirect('solicitar_recuperacao_senha')
        except PasswordResetToken.DoesNotExist:
            messages.error(request, 'Token inválido.')
            # Limpar sessão
            request.session.pop('password_reset_token_id', None)
            request.session.pop('password_reset_user_id', None)
            request.session.pop('password_reset_code_validated', None)
            return redirect('solicitar_recuperacao_senha')
        
        return render(request, "usuarios/login/redefinir-senha.html")
    
    def post(self, request):
        token_id = request.session.get('password_reset_token_id')
        user_id = request.session.get('password_reset_user_id')
        code_validated = request.session.get('password_reset_code_validated', False)
        
        if not token_id or not user_id:
            messages.error(request, 'Sessão expirada. Por favor, inicie o processo novamente.')
            return redirect('solicitar_recuperacao_senha')
        
        if not code_validated:
            messages.error(request, 'Código não foi validado. Por favor, valide o código primeiro.')
            return redirect('validar_codigo_recuperacao')
        
        new_password = request.POST.get('new_password', '').strip()
        confirm_password = request.POST.get('confirm_password', '').strip()
        
        if not new_password or not confirm_password:
            messages.error(request, 'Por favor, preencha todos os campos.')
            return render(request, "usuarios/login/redefinir-senha.html")
        
        if new_password != confirm_password:
            messages.error(request, 'As senhas não coincidem.')
            return render(request, "usuarios/login/redefinir-senha.html")
        
        if len(new_password) < 6:
            messages.error(request, 'A senha deve ter pelo menos 6 caracteres.')
            return render(request, "usuarios/login/redefinir-senha.html")
        
        try:
            token = PasswordResetToken.objects.get(id=token_id, user_id=user_id)
            
            # Verificar se token ainda é válido
            if not token.is_valid():
                messages.error(request, 'Código expirado. Solicite um novo código.')
                # Limpar sessão
                request.session.pop('password_reset_email', None)
                request.session.pop('password_reset_token_id', None)
                request.session.pop('password_reset_user_id', None)
                request.session.pop('password_reset_code_validated', None)
                return redirect('solicitar_recuperacao_senha')
            
            # Redefinir senha
            user = token.user
            user.set_password(new_password)
            user.save()
            
            # AGORA marcar token como usado (após sucesso)
            token.mark_as_used()
            
            # Limpar sessão
            request.session.pop('password_reset_email', None)
            request.session.pop('password_reset_token_id', None)
            request.session.pop('password_reset_user_id', None)
            request.session.pop('password_reset_code_validated', None)
            
            messages.success(request, 'Senha redefinida com sucesso! Faça login com sua nova senha.')
            return redirect('login')
            
        except PasswordResetToken.DoesNotExist:
            messages.error(request, 'Token inválido.')
            # Limpar sessão
            request.session.pop('password_reset_email', None)
            request.session.pop('password_reset_token_id', None)
            request.session.pop('password_reset_user_id', None)
            request.session.pop('password_reset_code_validated', None)
            return redirect('solicitar_recuperacao_senha')
        except Exception as e:
            print(f'Erro ao redefinir senha: {e}')
            import traceback
            traceback.print_exc()
            messages.error(request, 'Erro ao redefinir senha. Tente novamente.')
            return render(request, "usuarios/login/redefinir-senha.html")


    


