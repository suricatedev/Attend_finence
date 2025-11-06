from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
import json
from .models import Servico
from usuarios.decorators import user_can_view_services
from solicitacoes.models import Recebedor, ClienteEmpresa
from solicitacoes.views import garantir_migracao_campos

def servicos(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    # Verificar permissão: apenas Administrador pode ver serviços
    if not user_can_view_services(request.user):
        messages.error(request, 'Você não tem permissão para acessar esta página.')
        return redirect('home')
    
    # Garantir que a migração está aplicada antes de acessar os modelos
    garantir_migracao_campos()
    
    if request.method == 'GET':
        servicos_list = Servico.objects.all().order_by('nome')
        total_servicos = servicos_list.count()
        servicos_ativos = servicos_list.filter(ativo=True).count()
        
        # Buscar recebedores
        recebedores_list = Recebedor.objects.all().order_by('nome')
        total_recebedores = recebedores_list.count()
        recebedores_ativos = recebedores_list.filter(ativo=True).count()
        
        # Buscar clientes/empresas
        clientes_empresas_list = ClienteEmpresa.objects.all().order_by('nome')
        total_clientes_empresas = clientes_empresas_list.count()
        clientes_empresas_ativos = clientes_empresas_list.filter(ativo=True).count()
        
        return render(request, 'servicos.html', {
            'servicos': servicos_list,
            'total_servicos': total_servicos,
            'servicos_ativos': servicos_ativos,
            'recebedores': recebedores_list,
            'total_recebedores': total_recebedores,
            'recebedores_ativos': recebedores_ativos,
            'clientes_empresas': clientes_empresas_list,
            'total_clientes_empresas': total_clientes_empresas,
            'clientes_empresas_ativos': clientes_empresas_ativos
        })
    
    elif request.method == 'POST':
        # Criar novo serviço
        try:
            nome = request.POST.get('name', '').strip()
            descricao = request.POST.get('description', '').strip()
            ativo_str = request.POST.get('active', 'true')
            ativo = ativo_str.lower() == 'true'
            
            if not nome:
                messages.error(request, 'O nome do serviço é obrigatório!')
                return redirect('servicos')
            
            servico = Servico.objects.create(
                nome=nome,
                descricao=descricao,
                ativo=ativo
            )
            
            messages.success(request, f'Serviço "{nome}" criado com sucesso!')
            return redirect('servicos')
            
        except Exception as e:
            messages.error(request, f'Erro ao criar serviço: {str(e)}')
            return redirect('servicos')

@require_http_methods(["POST"])
def criar_servico(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        # Aceitar tanto FormData quanto JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            nome = data.get('name', '').strip()
            descricao = data.get('description', '').strip()
            ativo_str = data.get('active', 'true')
        else:
            # FormData
            nome = request.POST.get('name', '').strip()
            descricao = request.POST.get('description', '').strip()
            ativo_str = request.POST.get('active', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do serviço é obrigatório'})
        
        servico = Servico.objects.create(
            nome=nome,
            descricao=descricao if descricao else '',
            ativo=ativo
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Serviço "{nome}" criado com sucesso!',
            'servico': {
                'id': servico.id,
                'nome': servico.nome,
                'descricao': servico.descricao,
                'ativo': servico.ativo,
                'status_display': servico.get_status_display()
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST"])
def editar_servico(request, servico_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        servico = get_object_or_404(Servico, id=servico_id)
        
        # Aceitar tanto FormData quanto JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            nome = data.get('name', '').strip()
            descricao = data.get('description', '').strip()
            ativo_str = data.get('active', 'true')
        else:
            # FormData
            nome = request.POST.get('name', '').strip()
            descricao = request.POST.get('description', '').strip()
            ativo_str = request.POST.get('active', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do serviço é obrigatório'})
        
        servico.nome = nome
        servico.descricao = descricao if descricao else ''
        servico.ativo = ativo
        servico.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Serviço "{nome}" atualizado com sucesso!',
            'servico': {
                'id': servico.id,
                'nome': servico.nome,
                'descricao': servico.descricao,
                'ativo': servico.ativo,
                'status_display': servico.get_status_display()
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST", "DELETE"])
def deletar_servico(request, servico_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        servico = get_object_or_404(Servico, id=servico_id)
        nome = servico.nome
        servico.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Serviço "{nome}" deletado com sucesso!'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

# ============================================
# VIEWS PARA RECEBEDORES
# ============================================

@require_http_methods(["POST"])
def criar_recebedor(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        # Aceitar tanto FormData quanto JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            nome = data.get('nome', '').strip()
            chave_pix = data.get('chave_pix', '').strip()
            ativo_str = data.get('ativo', 'true')
        else:
            # FormData
            nome = request.POST.get('nome', '').strip()
            chave_pix = request.POST.get('chave_pix', '').strip()
            ativo_str = request.POST.get('ativo', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do recebedor é obrigatório'})
        
        if not chave_pix:
            return JsonResponse({'success': False, 'error': 'A chave PIX é obrigatória'})
        
        # Verificar se já existe recebedor com mesmo nome
        if Recebedor.objects.filter(nome__iexact=nome).exists():
            return JsonResponse({'success': False, 'error': f'Já existe um recebedor com o nome "{nome}"'})
        
        recebedor = Recebedor.objects.create(
            nome=nome,
            chave_pix=chave_pix,
            ativo=ativo
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Recebedor "{nome}" criado com sucesso!',
            'recebedor': {
                'id': recebedor.id,
                'nome': recebedor.nome,
                'chave_pix': recebedor.chave_pix,
                'ativo': recebedor.ativo
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST"])
def editar_recebedor(request, recebedor_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        recebedor = get_object_or_404(Recebedor, id=recebedor_id)
        
        # Aceitar tanto FormData quanto JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            nome = data.get('nome', '').strip()
            chave_pix = data.get('chave_pix', '').strip()
            ativo_str = data.get('ativo', 'true')
        else:
            # FormData
            nome = request.POST.get('nome', '').strip()
            chave_pix = request.POST.get('chave_pix', '').strip()
            ativo_str = request.POST.get('ativo', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do recebedor é obrigatório'})
        
        if not chave_pix:
            return JsonResponse({'success': False, 'error': 'A chave PIX é obrigatória'})
        
        # Verificar se já existe outro recebedor com mesmo nome
        if Recebedor.objects.filter(nome__iexact=nome).exclude(id=recebedor_id).exists():
            return JsonResponse({'success': False, 'error': f'Já existe um recebedor com o nome "{nome}"'})
        
        recebedor.nome = nome
        recebedor.chave_pix = chave_pix
        recebedor.ativo = ativo
        recebedor.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Recebedor "{nome}" atualizado com sucesso!',
            'recebedor': {
                'id': recebedor.id,
                'nome': recebedor.nome,
                'chave_pix': recebedor.chave_pix,
                'ativo': recebedor.ativo
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST", "DELETE"])
def deletar_recebedor(request, recebedor_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        recebedor = get_object_or_404(Recebedor, id=recebedor_id)
        nome = recebedor.nome
        recebedor.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Recebedor "{nome}" deletado com sucesso!'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

# ============================================
# VIEWS PARA CLIENTES/EMPRESAS
# ============================================

@require_http_methods(["POST"])
def criar_cliente_empresa(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        # Aceitar tanto FormData quanto JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            nome = data.get('nome', '').strip()
            cnpj = data.get('cnpj', '').strip()
            ativo_str = data.get('ativo', 'true')
        else:
            # FormData
            nome = request.POST.get('nome', '').strip()
            cnpj = request.POST.get('cnpj', '').strip()
            ativo_str = request.POST.get('ativo', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do cliente/empresa é obrigatório'})
        
        # Verificar se já existe cliente/empresa com mesmo nome
        if ClienteEmpresa.objects.filter(nome__iexact=nome).exists():
            return JsonResponse({'success': False, 'error': f'Já existe um cliente/empresa com o nome "{nome}"'})
        
        cliente_empresa = ClienteEmpresa.objects.create(
            nome=nome,
            cnpj=cnpj if cnpj else None,
            ativo=ativo
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Cliente/Empresa "{nome}" criado com sucesso!',
            'cliente_empresa': {
                'id': cliente_empresa.id,
                'nome': cliente_empresa.nome,
                'cnpj': cliente_empresa.cnpj or '',
                'ativo': cliente_empresa.ativo
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST"])
def editar_cliente_empresa(request, cliente_empresa_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        cliente_empresa = get_object_or_404(ClienteEmpresa, id=cliente_empresa_id)
        
        # Aceitar tanto FormData quanto JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            nome = data.get('nome', '').strip()
            cnpj = data.get('cnpj', '').strip()
            ativo_str = data.get('ativo', 'true')
        else:
            # FormData
            nome = request.POST.get('nome', '').strip()
            cnpj = request.POST.get('cnpj', '').strip()
            ativo_str = request.POST.get('ativo', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do cliente/empresa é obrigatório'})
        
        # Verificar se já existe outro cliente/empresa com mesmo nome
        if ClienteEmpresa.objects.filter(nome__iexact=nome).exclude(id=cliente_empresa_id).exists():
            return JsonResponse({'success': False, 'error': f'Já existe um cliente/empresa com o nome "{nome}"'})
        
        cliente_empresa.nome = nome
        cliente_empresa.cnpj = cnpj if cnpj else None
        cliente_empresa.ativo = ativo
        cliente_empresa.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Cliente/Empresa "{nome}" atualizado com sucesso!',
            'cliente_empresa': {
                'id': cliente_empresa.id,
                'nome': cliente_empresa.nome,
                'cnpj': cliente_empresa.cnpj or '',
                'ativo': cliente_empresa.ativo
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST", "DELETE"])
def deletar_cliente_empresa(request, cliente_empresa_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    try:
        cliente_empresa = get_object_or_404(ClienteEmpresa, id=cliente_empresa_id)
        nome = cliente_empresa.nome
        cliente_empresa.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Cliente/Empresa "{nome}" deletado com sucesso!'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
