from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Solicitacoes, SolicitacaoRotaItem
from servicos.models import Servico
from django.utils import timezone
import json

def receber_dados(request):
    if request.method == 'POST':
        try:
            
            # Verificar tipo de solicitação
            tipo_raw = request.POST.get('route', 'Casual')
            tipo = tipo_raw.lower().strip()
            if tipo == 'em rota' or tipo == 'em_rota':
                tipo = 'em_rota'
            else:
                tipo = 'casual'
            
            print(f"🔍 DEBUG: Tipo recebido do formulário: '{tipo_raw}' -> processado como: '{tipo}'")
            
            # Capturar dados comuns do POST baseado no tipo
            status = request.POST.get('status', 'pendente')
            
            # Dados são capturados com prefixos diferentes baseado no tipo
            if tipo == 'em_rota':
                nome_do_recebedor = request.POST.get('route_recebedor', '').strip()
                descricao = request.POST.get('route_description', '').strip()
                data_de_pagamento_str = request.POST.get('route_dataPagamento', '').strip()
                prioridade = request.POST.get('route_priority', 'baixa')
                anexo = request.FILES.get('route_anexos')
            else:  # Casual
                nome_do_recebedor = request.POST.get('casual_recebedor', '').strip()
                descricao = request.POST.get('casual_description', '').strip()
                data_de_pagamento_str = request.POST.get('casual_dataPagamento', '').strip()
                prioridade = request.POST.get('casual_priority', 'baixa')
                anexo = request.FILES.get('casual_anexos')
            
            print(f"🔍 DEBUG Campos - Tipo: '{tipo}', Recebedor: '{nome_do_recebedor}', Descrição: '{descricao[:50]}...', Data: '{data_de_pagamento_str}', Prioridade: '{prioridade}'")
            
            # Validação básica dos campos obrigatórios (apenas para feedback do backend)
            # A validação principal deve ser feita no frontend
            if not nome_do_recebedor:
                messages.error(request, 'O campo "Nome do Recebedor" é obrigatório.')
                return redirect('/solicitacoes/home/')
            
            if not descricao:
                messages.error(request, 'O campo "Descrição" é obrigatório.')
                return redirect('/solicitacoes/home/')
                
            if not data_de_pagamento_str:
                messages.error(request, 'O campo "Data de Pagamento" é obrigatório.')
                return redirect('/solicitacoes/home/')
            
            # Converter string de data para objeto Date
            from datetime import datetime
            try:
                data_de_pagamento = datetime.strptime(data_de_pagamento_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                messages.error(request, 'Data de pagamento inválida. Use o formato correto.')
                return redirect('/solicitacoes/home/')
            
            # Arquivos já capturados acima baseado no tipo (route_anexos ou casual_anexos)
            
            # ✅ Calcular automaticamente tempo de criação (horário atual)
            tempo_criacao_auto = timezone.now().time()
            
            # ✅ Tempo na fila começa em 00:00:00 (será calculado dinamicamente no frontend)
            from datetime import time
            tempo_fila_inicial = time(0, 0, 0)
            
            if tipo == 'em_rota':
                # Processar solicitação Em Rota
                # Coletar todos os itens da rota
                itens_rota = []
                valor_total = 0.0
                ticket_principal = None
                
                for i in range(1, 5):
                    route_id = request.POST.get(f'route_id_{i}', '').strip()
                    route_valor_raw = request.POST.get(f'route_valor_{i}', '').strip()
                    route_servico_id = request.POST.get(f'route_servico_{i}', '').strip()
                    
                    print(f"🔍 DEBUG Em Rota - Item {i}: ID='{route_id}', Valor='{route_valor_raw}', Servico='{route_servico_id}'")
                    
                    if route_id:  # Se há ID, deve ter valor e serviço
                        # Limpar valor - mesmo tratamento do Casual
                        valor_item = 0.0
                        if route_valor_raw:
                            try:
                                # Remover formatação brasileira
                                valor_limpo = route_valor_raw.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.').strip()
                                valor_item = float(valor_limpo)
                                print(f"🔍 DEBUG Em Rota - Item {i} valor processado: {valor_item}")
                            except (ValueError, AttributeError) as e:
                                print(f"⚠️ ERRO ao processar valor do item {i} '{route_valor_raw}': {e}")
                                valor_item = 0.0
                        
                        # Buscar serviço
                        servico_obj = None
                        if route_servico_id:
                            try:
                                servico_obj = Servico.objects.get(id=route_servico_id, ativo=True)
                            except Servico.DoesNotExist:
                                pass
                        
                        if i == 1:
                            ticket_principal = route_id
                        
                        itens_rota.append({
                            'ticket': route_id,
                            'valor': valor_item,
                            'servico': servico_obj,
                            'ordem': i
                        })
                        valor_total += valor_item
                
                if len(itens_rota) < 2:
                    messages.error(request, 'Solicitação Em Rota precisa de no mínimo 2 itens preenchidos.')
                    return redirect('/solicitacoes/home/')
                
                if not ticket_principal:
                    ticket_principal = itens_rota[0]['ticket']
                
                # ⚠️ VALIDAÇÃO: Verificar se algum ID da rota já existe no banco de dados
                tickets_rota = [item['ticket'] for item in itens_rota if item['ticket']]
                tickets_existentes = []
                for ticket in tickets_rota:
                    if Solicitacoes.objects.filter(ticket=ticket).exists():
                        solicitacao_existente = Solicitacoes.objects.filter(ticket=ticket).first()
                        # Obter o tipo de forma segura
                        if solicitacao_existente:
                            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                            tipo_existente = tipo_dict.get(solicitacao_existente.tipo, solicitacao_existente.tipo)
                        else:
                            tipo_existente = "N/A"
                        tickets_existentes.append(f"{ticket} (Tipo: {tipo_existente})")
                
                if tickets_existentes:
                    tickets_str = ", ".join(tickets_existentes)
                    messages.error(
                        request, 
                        f'Os seguintes IDs já estão cadastrados no sistema: {tickets_str}. '
                        f'Por favor, use IDs diferentes para os itens da rota.'
                    )
                    print(f"❌ ERRO: IDs já existem no banco de dados: {tickets_existentes}")
                    return redirect('/solicitacoes/home/')
                
                # Verificar se o ticket principal já existe
                if Solicitacoes.objects.filter(ticket=ticket_principal).exists():
                    solicitacao_existente = Solicitacoes.objects.filter(ticket=ticket_principal).first()
                    # Obter o tipo de forma segura
                    if solicitacao_existente:
                        tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                        tipo_existente = tipo_dict.get(solicitacao_existente.tipo, solicitacao_existente.tipo)
                    else:
                        tipo_existente = "N/A"
                    messages.error(
                        request, 
                        f'O ID principal "{ticket_principal}" já está cadastrado no sistema! '
                        f'Por favor, use um ID diferente. (Tipo existente: {tipo_existente})'
                    )
                    print(f"❌ ERRO: Ticket principal '{ticket_principal}' já existe no banco de dados!")
                    return redirect('/solicitacoes/home/')
                
                # Gerar título automaticamente baseado nos IDs da rota
                route_tickets = [item['ticket'] for item in itens_rota]
                titulo = f"Solicitação Em Rota - {', '.join(route_tickets)}"
                
                # Criar solicitação principal
                print(f"🔍 DEBUG Criando solicitação Em Rota:")
                print(f"   - Ticket: {ticket_principal}")
                print(f"   - Valor Total: {valor_total}")
                print(f"   - Itens: {len(itens_rota)}")
                
                solicitacao = Solicitacoes.objects.create(
                    ticket=ticket_principal or 'ROTA-' + str(timezone.now().timestamp()),
                    status=status,
                    titulo=titulo,
                    nome_solicitante=request.user,
                    nome_do_recebedor=nome_do_recebedor,
                    valor=valor_total,
                    descricao=descricao,
                    data_de_pagamento=data_de_pagamento,
                    data_de_criacao=timezone.now().date(),
                    anexo=anexo,
                    tempo_criacao=tempo_criacao_auto,
                    tempo_fila=tempo_fila_inicial,
                    prioridade=prioridade,
                    servico=itens_rota[0]['servico'],  # Serviço principal (primeiro item)
                    tipo='em_rota'
                )
                
                print(f"✅ Solicitação Em Rota criada com sucesso! ID: {solicitacao.id}")
                
                # Criar itens da rota
                for item in itens_rota:
                    SolicitacaoRotaItem.objects.create(
                        solicitacao=solicitacao,
                        ticket_item=item['ticket'],
                        valor=item['valor'],
                        servico=item['servico'],
                        ordem=item['ordem']
                    )
                
            else:
                # Processar solicitação Casual (original)
                id = request.POST.get('casual_id', '').strip()
                valor_raw = request.POST.get('casual_valor', '').strip()
                servico_id = request.POST.get('casual_service', '').strip()
                
                print(f"🔍 DEBUG Casual - ID='{id}', Valor='{valor_raw}', Servico='{servico_id}'")
                
                # ⚠️ VALIDAÇÃO: Verificar se o ID (ticket) já existe no banco de dados
                if id:
                    # Verificar se já existe uma solicitação (de qualquer tipo) com esse ticket
                    ticket_existente = Solicitacoes.objects.filter(ticket=id).exists()
                    if ticket_existente:
                        solicitacao_existente = Solicitacoes.objects.filter(ticket=id).first()
                        # Obter o tipo de forma segura
                        if solicitacao_existente:
                            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                            tipo_existente = tipo_dict.get(solicitacao_existente.tipo, solicitacao_existente.tipo)
                        else:
                            tipo_existente = "N/A"
                        messages.error(
                            request, 
                            f'O ID "{id}" já está cadastrado no sistema! '
                            f'Por favor, use um ID diferente. (Tipo existente: {tipo_existente})'
                        )
                        print(f"❌ ERRO: ID '{id}' já existe no banco de dados!")
                        return redirect('/solicitacoes/home/')
                
                # Limpar valor: remover R$, pontos e trocar vírgula por ponto
                valor = 0.0
                if valor_raw:
                    try:
                        # Remover formatação brasileira
                        valor_limpo = valor_raw.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.').strip()
                        valor = float(valor_limpo)
                        print(f"🔍 DEBUG - Valor processado: {valor}")
                    except (ValueError, AttributeError) as e:
                        print(f"⚠️ ERRO ao processar valor '{valor_raw}': {e}")
                        valor = 0.0
                
                # Buscar o objeto Servico pelo ID
                servico_obj = None
                if servico_id:
                    try:
                        servico_obj = Servico.objects.get(id=servico_id, ativo=True)
                    except Servico.DoesNotExist:
                        messages.warning(request, f'Serviço selecionado não encontrado ou inativo.')
                
                # Gerar título automaticamente para solicitação Casual
                titulo = f"Solicitação Casual - {id}" if id else "Solicitação Casual"
                
                # Gerar ticket único se não fornecido
                ticket_final = id if id else f'CASUAL-{timezone.now().timestamp()}'
                
                # Criar e salvar no banco
                print(f"🔍 DEBUG Criando solicitação Casual:")
                print(f"   - ID/Ticket: {ticket_final}")
                print(f"   - Valor: {valor}")
                print(f"   - Serviço: {servico_obj}")
                print(f"   - Tipo: casual")
                
                try:
                    solicitacao = Solicitacoes.objects.create(
                        ticket=ticket_final,
                        status=status,
                        titulo=titulo,
                        nome_solicitante=request.user,
                        nome_do_recebedor=nome_do_recebedor,
                        valor=valor,
                        descricao=descricao,
                        data_de_pagamento=data_de_pagamento,
                        data_de_criacao=timezone.now().date(),
                        anexo=anexo,
                        tempo_criacao=tempo_criacao_auto,
                        tempo_fila=tempo_fila_inicial,
                        prioridade=prioridade,
                        servico=servico_obj,
                        tipo='casual'
                    )
                    
                    print(f"✅ Solicitação Casual criada com sucesso! ID: {solicitacao.id}, Ticket: {solicitacao.ticket}")
                except Exception as e:
                    print(f"❌ ERRO ao criar solicitação Casual: {e}")
                    messages.error(request, f'Erro ao criar solicitação Casual: {str(e)}')
                    return redirect('/solicitacoes/home/')
            
            messages.success(request, 'Solicitação criada com sucesso!')
            # Redirect para a mesma página para recarregar e mostrar o novo card
            return redirect('/solicitacoes/home/')
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"❌ ERRO GERAL ao processar solicitação: {str(e)}")
            print(f"📋 Traceback completo:\n{error_trace}")
            messages.error(request, f'Erro ao criar solicitação: {str(e)}')
            return redirect('/solicitacoes/home/')
    
    elif request.method == 'GET':
        """
        Verifica se o usuário que está dentro da requisição está autenticado, 
        se sim ele retorna e renderiza a página de home.
        Se não, retorna e redireciona para a área do login.
        """
        if request.user.is_authenticated:
            # Otimização: Buscar todas as solicitações de uma vez
            # e usar select_related e prefetch_related para otimizar queries
            todas_solicitacoes = Solicitacoes.objects.select_related('nome_solicitante', 'servico').prefetch_related('itens_rota__servico').all()
            
            # Filtrar em memória ao invés de fazer múltiplas queries
            solicitacoes_pendentes = [s for s in todas_solicitacoes if s.status == "pendente"]
            solicitacoes_recusados = [s for s in todas_solicitacoes if s.status == "recusado"]
            solicitacoes_aprovado = [s for s in todas_solicitacoes if s.status == "aprovado"]
            solicitacoes_concluido = [s for s in todas_solicitacoes if s.status == "concluido"]
            
            return render(request, 'index.html', {
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


@require_http_methods(["GET"])
def obter_itens_rota(request, solicitacao_id):
    """
    View para obter os itens da rota de uma solicitação via AJAX
    """
    try:
        solicitacao = Solicitacoes.objects.prefetch_related('itens_rota__servico').get(id=solicitacao_id)
        
        # Verificar se é uma solicitação "Em Rota"
        if solicitacao.tipo != 'em_rota':
            return JsonResponse({
                'success': False,
                'message': 'Esta solicitação não é do tipo "Em Rota"'
            }, status=400)
        
        # Buscar todos os itens da rota
        itens = solicitacao.itens_rota.all().order_by('ordem')
        
        # Serializar os itens
        itens_data = []
        for item in itens:
            itens_data.append({
                'ordem': item.ordem,
                'id': item.ticket_item,
                'valor': f'R$ {item.valor:.2f}',
                'servico': item.servico.nome if item.servico else 'N/A'
            })
        
        return JsonResponse({
            'success': True,
            'itens': itens_data,
            'valor_total': f'R$ {solicitacao.valor:.2f}'
        })
        
    except Solicitacoes.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Solicitação não encontrada'
        }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao obter itens da rota: {str(e)}'
        }, status=500)

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
