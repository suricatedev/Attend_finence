from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Solicitacoes
from servicos.models import Servico
from django.utils import timezone
import json

def receber_dados(request):
    if request.method == 'POST':
        try:

            # Capturar dados do POST
            id = request.POST.get('id')
            status = request.POST.get('status', 'pendente')
            titulo = request.POST.get('title')  
            nome_do_recebedor = request.POST.get('recebedor')  
            valor_raw = request.POST.get('valor')
            descricao = request.POST.get('description') 
            data_de_pagamento = request.POST.get('dataPagamento')   
            prioridade = request.POST.get('priority') 
            servico_id = request.POST.get('service')

            # Captura de arquivos
            anexo = request.FILES.get('anexos')
            
            # Limpar valor: remover R$, pontos e trocar vírgula por ponto
            valor = float(valor_raw.replace('R$', '').replace('.', '').replace(',', '.').strip()) if valor_raw else 0.0
            
            # ✅ Calcular automaticamente tempo de criação (horário atual)
            tempo_criacao_auto = timezone.now().time()
            
            # ✅ Tempo na fila começa em 00:00:00 (será calculado dinamicamente no frontend)
            from datetime import time
            tempo_fila_inicial = time(0, 0, 0)
            
            # Buscar o objeto Servico pelo ID
            servico_obj = None
            if servico_id:
                try:
                    servico_obj = Servico.objects.get(id=servico_id, ativo=True)
                except Servico.DoesNotExist:
                    messages.warning(request, f'Serviço selecionado não encontrado ou inativo.')
            
            # Criar e salvar no banco
            solicitacao = Solicitacoes.objects.create(
                ticket = id,
                status=status,
                titulo=titulo,
                nome_solicitante=request.user,  # ✅ Usuário logado (ForeignKey)
                nome_do_recebedor=nome_do_recebedor,
                valor=valor,
                descricao=descricao,
                data_de_pagamento=data_de_pagamento,
                data_de_criacao=timezone.now().date(),  # Data de hoje
                anexo=anexo,
                tempo_criacao=tempo_criacao_auto,  # Horário atual
                tempo_fila=tempo_fila_inicial,  # Inicia em 00:00:00
                prioridade=prioridade,
                servico=servico_obj
            )
            
            # Nota: O ID externo (id_externo) e nome do solicitante (solicitante_nome) 
            # são capturados mas não salvos no modelo atual
            # Se necessário, adicione esses campos ao modelo Solicitacoes
            
            messages.success(request, 'Solicitação criada com sucesso!')
            return redirect('home')
            
        except Exception as e:
            messages.error(request, f'Erro ao criar solicitação: {str(e)}')
            return redirect('home')
    
    elif request.method == 'GET':
        """
        Verifica se o usuário que está dentro da requisição está autenticado, 
        se sim ele retorna e renderiza a página de home.
        Se não, retorna e redireciona para a área do login.
        """
        if request.user.is_authenticated:
            # Otimização: Buscar todas as solicitações de uma vez
            # e usar select_related se houver foreign keys
            todas_solicitacoes = Solicitacoes.objects.all()
            
            # Filtrar em memória ao invés de fazer múltiplas queries
            solicitacoes_pendentes = [s for s in todas_solicitacoes if s.status == "pendente"]
            solicitacoes_recusados = [s for s in todas_solicitacoes if s.status == "recusado"]
            solicitacoes_aprovado = [s for s in todas_solicitacoes if s.status == "aprovado"]
            solicitacoes_concluido = [s for s in todas_solicitacoes if s.status == "concluido"]
            
            return render(request, 'home/index.html', {
                'solicitacoes_pendentes': solicitacoes_pendentes,
                'num_solicitacoes_pendentes': len(solicitacoes_pendentes),

                'solicitacoes_recusados': solicitacoes_recusados,
                'num_solicitacoes_recusados': len(solicitacoes_recusados),

                'solicitacoes_aprovado': solicitacoes_aprovado,
                'num_solicitacoes_aprovado': len(solicitacoes_aprovado),

                'solicitacoes_concluido': solicitacoes_concluido,
                'num_solicitacoes_concluido': len(solicitacoes_concluido),
            })
        else:
            return redirect('login')


@require_http_methods(["POST"])
def atualizar_status(request):
    """
    View para atualizar o status de uma solicitação via AJAX
    Apenas Financeiro e Administrador podem mudar status
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'Não autenticado'
        }, status=401)
    
    # Verificar permissão: apenas Financeiro e Admin podem mudar status
    from usuarios.decorators import user_can_change_status
    if not user_can_change_status(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Você não tem permissão para alterar o status de solicitações.'
        }, status=403)
    
    try:
        # Ler dados do corpo da requisição
        data = json.loads(request.body)
        card_id = data.get('card_id')
        new_status = data.get('status')
        
        # Mapear filas do Kanban para status do banco
        status_mapping = {
            'planning': 'pendente',
            'test': 'recusado',
            'launch': 'aprovado',
            'success': 'concluido'
        }
        
        # Validar dados
        if not card_id or not new_status:
            return JsonResponse({
                'success': False,
                'message': 'Dados inválidos'
            }, status=400)
        
        # Converter fila para status
        status_db = status_mapping.get(new_status, new_status)
        
        # Buscar e atualizar solicitação
        solicitacao = Solicitacoes.objects.get(id=card_id)
        solicitacao.status = status_db
        solicitacao.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Status atualizado para {status_db}',
            'card_id': card_id,
            'new_status': status_db
        })
        
    except Solicitacoes.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Solicitação não encontrada'
        }, status=404)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Erro ao processar dados JSON'
        }, status=400)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao atualizar status: {str(e)}'
        }, status=500)
