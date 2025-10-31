from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
import json
from .models import Servico
from usuarios.decorators import user_can_view_services

def servicos(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    # Verificar permissão: apenas Administrador pode ver serviços
    if not user_can_view_services(request.user):
        messages.error(request, 'Você não tem permissão para acessar esta página.')
        return redirect('home')
    
    if request.method == 'GET':
        servicos_list = Servico.objects.all().order_by('nome')
        total_servicos = servicos_list.count()
        servicos_ativos = servicos_list.filter(ativo=True).count()
        
        return render(request, 'servicos.html', {
            'servicos': servicos_list,
            'total_servicos': total_servicos,
            'servicos_ativos': servicos_ativos
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
