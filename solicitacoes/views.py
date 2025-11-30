from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import Solicitacoes, SolicitacaoRotaItem, Recebedor, ClienteEmpresa
from servicos.models import Servico
from django.utils import timezone
import json

STATUS_VALIDOS = {choice[0] for choice in Solicitacoes._meta.get_field('status').choices}


def normalizar_status(valor):
    """
    Normaliza o valor do status para garantir consistência com os choices do modelo.
    Retorna 'pendente' como fallback seguro quando o valor for inválido.
    """
    if not valor:
        return 'pendente'
    valor_normalizado = valor.strip().lower()
    if valor_normalizado not in STATUS_VALIDOS:
        return 'pendente'
    return valor_normalizado


def registrar_recebedor(nome, chave_pix=None):
    """
    Garante que o recebedor esteja registrado na tabela Recebedor.
    Retorna o objeto criado/atualizado ou None quando não foi possível registrar.
    """
    if not nome:
        return None
    
    chave_pix_normalizada = (chave_pix or "").strip()
    if not chave_pix_normalizada:
        chave_pix_normalizada = ""
    
    try:
        recebedor_obj, created = Recebedor.objects.update_or_create(
            nome=nome.strip(),
            defaults={
                'chave_pix': chave_pix_normalizada,
                'ativo': True,
            }
        )
        if created:
            print(f"✅ Recebedor '{recebedor_obj.nome}' registrado automaticamente.")
        return recebedor_obj
    except Exception as e:
        print(f"⚠️ Erro ao registrar recebedor '{nome}': {e}")
        return None


def limpar_valor_monetario(valor_raw):
    """Função auxiliar para limpar e converter valores monetários formatados"""
    if not valor_raw:
        return 0.0
    try:
        # Remover formatação brasileira: R$, espaços, pontos de milhar, trocar vírgula por ponto
        valor_limpo = valor_raw.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.').strip()
        return float(valor_limpo) if valor_limpo else 0.0
    except (ValueError, AttributeError):
        return 0.0

def garantir_migracao_campos():
    """
    Função auxiliar para garantir que os campos necessários existam no banco.
    Aplica a migração automaticamente se os campos não existirem.
    Também cria a tabela ClienteEmpresa se não existir.
    """
    try:
        from django.db import connection
        cursor = connection.cursor()
        
        campos_adicionados = False
        alteracoes_0007 = False

        # Verificar e criar tabela ClienteEmpresa se não existir
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='solicitacoes_clienteempresa';
        """)
        tabela_existe = cursor.fetchone()
        if not tabela_existe:
            try:
                cursor.execute("""
                    CREATE TABLE solicitacoes_clienteempresa (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome VARCHAR(200) NOT NULL UNIQUE,
                        cnpj VARCHAR(18),
                        ativo BOOLEAN NOT NULL DEFAULT 1,
                        data_criacao DATETIME NOT NULL,
                        data_atualizacao DATETIME NOT NULL
                    );
                """)
                print("✅ Tabela solicitacoes_clienteempresa criada automaticamente!")
                campos_adicionados = True
            except Exception as e:
                if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                    print(f"⚠️ Erro ao criar tabela ClienteEmpresa: {e}")
        else:
            # Se a tabela existe, verificar se tem o campo CNPJ
            cursor.execute("PRAGMA table_info(solicitacoes_clienteempresa)")
            columns_cliente = [row[1] for row in cursor.fetchall()]
            if 'cnpj' not in columns_cliente:
                try:
                    cursor.execute("ALTER TABLE solicitacoes_clienteempresa ADD COLUMN cnpj VARCHAR(18) DEFAULT NULL;")
                    print("✅ Campo cnpj adicionado à tabela solicitacoes_clienteempresa")
                    campos_adicionados = True
                except Exception as e:
                    if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                        print(f"⚠️ Erro ao adicionar campo cnpj na tabela ClienteEmpresa: {e}")

        # Verificar e criar tabela Recebedor se não existir
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='solicitacoes_recebedor';
        """)
        tabela_recebedor = cursor.fetchone()
        if not tabela_recebedor:
            try:
                cursor.execute("""
                    CREATE TABLE solicitacoes_recebedor (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome VARCHAR(100) NOT NULL UNIQUE,
                        chave_pix VARCHAR(255) NOT NULL,
                        ativo BOOLEAN NOT NULL DEFAULT 1,
                        data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                print("✅ Tabela solicitacoes_recebedor criada automaticamente!")
                alteracoes_0007 = True
            except Exception as e:
                if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                    print(f"⚠️ Erro ao criar tabela Recebedor: {e}")
        else:
            # Se a tabela Recebedor existe, verificar se tem o campo supervisor
            cursor.execute("PRAGMA table_info(solicitacoes_recebedor)")
            columns_recebedor = [row[1] for row in cursor.fetchall()]
            if 'supervisor' not in columns_recebedor:
                try:
                    cursor.execute("""
                        ALTER TABLE solicitacoes_recebedor 
                        ADD COLUMN supervisor VARCHAR(50) DEFAULT NULL;
                    """)
                    print("✅ Campo supervisor adicionado à tabela solicitacoes_recebedor")
                    campos_adicionados = True
                except Exception as e:
                    if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                        print(f"⚠️ Erro ao adicionar campo supervisor na tabela Recebedor: {e}")
        
        cursor.execute("PRAGMA table_info(solicitacoes_solicitacoes)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Verificar se campos faltam e aplicar migração SQL diretamente
        campos_necessarios = {
            'data_entrada_status': "ALTER TABLE solicitacoes_solicitacoes ADD COLUMN data_entrada_status DATETIME DEFAULT NULL;",
            'valor_em_rota': "ALTER TABLE solicitacoes_solicitacoes ADD COLUMN valor_em_rota REAL DEFAULT 0.0;",
            'descricao_em_rota': "ALTER TABLE solicitacoes_solicitacoes ADD COLUMN descricao_em_rota TEXT DEFAULT NULL;",
            'chave_pix': "ALTER TABLE solicitacoes_solicitacoes ADD COLUMN chave_pix VARCHAR(255) DEFAULT NULL;",
            'cliente_empresa': "ALTER TABLE solicitacoes_solicitacoes ADD COLUMN cliente_empresa VARCHAR(200) DEFAULT NULL;",
            'cnpj': "ALTER TABLE solicitacoes_solicitacoes ADD COLUMN cnpj VARCHAR(18) DEFAULT NULL;"
        }
        
        campos_adicionados = False
        for campo, sql in campos_necessarios.items():
            if campo not in columns:
                try:
                    cursor.execute(sql)
                    print(f"✅ Campo {campo} adicionado ao banco de dados")
                    campos_adicionados = True
                except Exception as e:
                    if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                        print(f"⚠️ Erro ao adicionar campo {campo}: {e}")
        
        # Verificar também na tabela de itens de rota
        cursor.execute("PRAGMA table_info(solicitacoes_solicitacaorotaitem)")
        columns_rota = [row[1] for row in cursor.fetchall()]
        
        if 'cliente_empresa' not in columns_rota:
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN cliente_empresa VARCHAR(200) DEFAULT NULL;")
                print(f"✅ Campo cliente_empresa adicionado à tabela solicitacoes_solicitacaorotaitem")
                campos_adicionados = True
            except Exception as e:
                if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                    print(f"⚠️ Erro ao adicionar campo cliente_empresa na tabela de itens: {e}")
        
        # Verificar se campo CNPJ existe na tabela de itens de rota
        if 'cnpj' not in columns_rota:
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN cnpj VARCHAR(18) DEFAULT NULL;")
                print(f"✅ Campo cnpj adicionado à tabela solicitacoes_solicitacaorotaitem")
                campos_adicionados = True
            except Exception as e:
                if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                    print(f"⚠️ Erro ao adicionar campo cnpj na tabela de itens: {e}")

        # Verificar campos de recebedor na tabela de itens de rota (migração 0007)
        if 'recebedor' not in columns_rota:
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN recebedor VARCHAR(100) DEFAULT NULL;")
                print("✅ Campo recebedor adicionado à tabela solicitacoes_solicitacaorotaitem")
                alteracoes_0007 = True
            except Exception as e:
                if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                    print(f"⚠️ Erro ao adicionar campo recebedor na tabela de itens: {e}")

        if 'chave_pix' not in columns_rota:
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacaorotaitem ADD COLUMN chave_pix VARCHAR(255) DEFAULT NULL;")
                print("✅ Campo chave_pix adicionado à tabela solicitacoes_solicitacaorotaitem")
                alteracoes_0007 = True
            except Exception as e:
                if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                    print(f"⚠️ Erro ao adicionar campo chave_pix na tabela de itens: {e}")
        
        # Verificar se campo CNPJ existe na tabela principal
        if 'cnpj' not in columns:
            try:
                cursor.execute("ALTER TABLE solicitacoes_solicitacoes ADD COLUMN cnpj VARCHAR(18) DEFAULT NULL;")
                print(f"✅ Campo cnpj adicionado à tabela solicitacoes_solicitacoes")
                campos_adicionados = True
            except Exception as e:
                if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                    print(f"⚠️ Erro ao adicionar campo cnpj: {e}")
        
        # Se data_entrada_status foi adicionado, atualizar registros existentes
        if campos_adicionados:
            try:
                # Verificar se o campo existe agora (pode ter sido adicionado)
                cursor.execute("PRAGMA table_info(solicitacoes_solicitacoes)")
                columns_atualizadas = [row[1] for row in cursor.fetchall()]
                if 'data_entrada_status' in columns_atualizadas:
                    cursor.execute("""
                        UPDATE solicitacoes_solicitacoes 
                        SET data_entrada_status = datetime(data_de_criacao || ' ' || time(tempo_criacao))
                        WHERE data_entrada_status IS NULL;
                    """)
                    print(f"✅ {cursor.rowcount} registros atualizados com data_entrada_status")
            except Exception as e:
                print(f"⚠️ Erro ao atualizar data_entrada_status: {e}")
        
        # Registrar migração se aplicou alguma
        if campos_adicionados:
            try:
                cursor.execute(
                    "INSERT OR IGNORE INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ['solicitacoes', '0006_add_data_entrada_status', timezone.now()]
                )
                print("✅ Migração 0006 registrada no Django")
            except Exception as e:
                print(f"⚠️ Erro ao registrar migração (pode ser ignorado): {e}")
        if alteracoes_0007:
            try:
                cursor.execute(
                    "INSERT OR IGNORE INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                    ['solicitacoes', '0007_recebedor_solicitacaorotaitem_chave_pix_and_more', timezone.now()]
                )
                print("✅ Migração 0007 registrada no Django")
            except Exception as e:
                print(f"⚠️ Erro ao registrar migração 0007 (pode ser ignorado): {e}")
    except Exception as e:
        print(f"⚠️ Erro ao verificar/aplicar migração: {e}")

def receber_dados(request):
    # Garantir que a migração está aplicada antes de processar qualquer requisição
    garantir_migracao_campos()
    
    if request.method == 'POST':
        try:
            solicitacao_id_raw = (request.POST.get('solicitacao_id') or '').strip()
            print(f"🔍 DEBUG EDIÇÃO - solicitacao_id recebido: '{solicitacao_id_raw}'")
            print(f"🔍 DEBUG EDIÇÃO - Todos os campos POST recebidos: {list(request.POST.keys())}")
            solicitacao_existente = None
            if solicitacao_id_raw:
                try:
                    solicitacao_existente = Solicitacoes.objects.select_related('servico').prefetch_related('itens_rota').get(id=int(solicitacao_id_raw))
                    print(f"✅ DEBUG EDIÇÃO - Solicitação encontrada: ID={solicitacao_existente.id}, Ticket={solicitacao_existente.ticket}, Status={solicitacao_existente.status}")
                except (ValueError, Solicitacoes.DoesNotExist) as e:
                    print(f"❌ DEBUG EDIÇÃO - Erro ao buscar solicitação: {e}")
                    messages.error(request, 'Solicitação para edição não foi encontrada ou já foi removida.')
                    return redirect('/solicitacoes/home/')
                
                if normalizar_status(solicitacao_existente.status) != 'pendente':
                    print(f"❌ DEBUG EDIÇÃO - Status não permite edição: {solicitacao_existente.status}")
                    messages.error(request, 'Somente solicitações pendentes podem ser editadas.')
                    return redirect('/solicitacoes/home/')
            
            is_edit_mode = solicitacao_existente is not None
            print(f"🔍 DEBUG EDIÇÃO - Modo edição ativado: {is_edit_mode}")
            success_message = 'Solicitação atualizada com sucesso!' if is_edit_mode else 'Solicitação criada com sucesso!'
            
            # Verificar tipo de solicitação
            tipo_raw = request.POST.get('route', 'Casual')
            tipo = tipo_raw.lower().strip()
            if tipo == 'em rota' or tipo == 'em_rota':
                tipo = 'em_rota'
            else:
                tipo = 'casual'
            
            print(f"🔍 DEBUG: Tipo recebido do formulário: '{tipo_raw}' -> processado como: '{tipo}'")
            
            # Capturar dados comuns
            status = normalizar_status(request.POST.get('status') or 'pendente')
            if is_edit_mode:
                status = normalizar_status(solicitacao_existente.status)
            nome_do_recebedor = ''
            
            # Dados são capturados com prefixos diferentes baseado no tipo
            if tipo == 'em_rota':
                descricao = request.POST.get('route_description', '').strip()
                data_de_pagamento_str = request.POST.get('route_dataPagamento', '').strip()
                prioridade = request.POST.get('route_priority', 'baixa')
                anexo = request.FILES.get('route_anexos')
                # Para Em Rota, os valores detalhados estão apenas nos itens, não no geral
                # Apenas o valor de receita é geral
                valor_km = 0.0
                valor_pedagio = 0.0
                valor_hospedagem = 0.0
                valor_fluvial = 0.0
                valor_outros = 0.0
                valor_em_rota = limpar_valor_monetario(request.POST.get('route_valor_em_rota', '').strip())
                descricao_em_rota = request.POST.get('route_descricao_em_rota', '').strip()
                valor_receita = limpar_valor_monetario(request.POST.get('route_valor_receita', '').strip())
            else:  # Casual
                nome_do_recebedor = request.POST.get('casual_recebedor', '').strip()
                chave_pix_casual = request.POST.get('casual_pix', '').strip()
                cliente_empresa_casual = request.POST.get('casual_cliente_empresa', '').strip()
                cnpj_casual = request.POST.get('casual_cnpj', '').strip()
                descricao = request.POST.get('casual_description', '').strip()
                data_de_pagamento_str = request.POST.get('casual_dataPagamento', '').strip()
                prioridade = request.POST.get('casual_priority', 'baixa')
                anexo = request.FILES.get('casual_anexos')
                # Capturar valores detalhados para Casual
                valor_km_raw = request.POST.get('casual_valor_km', '').strip()
                valor_pedagio_raw = request.POST.get('casual_valor_pedagio', '').strip()
                valor_hospedagem_raw = request.POST.get('casual_valor_hospedagem', '').strip()
                valor_fluvial_raw = request.POST.get('casual_valor_fluvial', '').strip()
                valor_outros_raw = request.POST.get('casual_valor_outros', '').strip()
                valor_receita_raw = request.POST.get('casual_valor_receita', '').strip()
                
                valor_km = limpar_valor_monetario(valor_km_raw)
                valor_pedagio = limpar_valor_monetario(valor_pedagio_raw)
                valor_hospedagem = limpar_valor_monetario(valor_hospedagem_raw)
                valor_fluvial = limpar_valor_monetario(valor_fluvial_raw)
                valor_outros = limpar_valor_monetario(valor_outros_raw)
                valor_receita = limpar_valor_monetario(valor_receita_raw)
                
                if is_edit_mode:
                    print(f"🔍 DEBUG EDIÇÃO CASUAL - Valores capturados do formulário:")
                    print(f"   - casual_valor_km: '{valor_km_raw}' -> {valor_km}")
                    print(f"   - casual_valor_pedagio: '{valor_pedagio_raw}' -> {valor_pedagio}")
                    print(f"   - casual_valor_hospedagem: '{valor_hospedagem_raw}' -> {valor_hospedagem}")
                    print(f"   - casual_valor_fluvial: '{valor_fluvial_raw}' -> {valor_fluvial}")
                    print(f"   - casual_valor_outros: '{valor_outros_raw}' -> {valor_outros}")
                    print(f"   - casual_valor_receita: '{valor_receita_raw}' -> {valor_receita}")
                
                # Registrar recebedor no catálogo principal para reaproveitamento
                registrar_recebedor(nome_do_recebedor, chave_pix_casual)
            
            print(f"🔍 DEBUG Campos - Tipo: '{tipo}', Recebedor: '{nome_do_recebedor}', Descrição: '{descricao[:50]}...', Data: '{data_de_pagamento_str}', Prioridade: '{prioridade}'")
            
            # Validação básica dos campos obrigatórios (apenas para feedback do backend)
            # A validação principal deve ser feita no frontend
            # Se for requisição AJAX, retornar JSON ao invés de redirect
            is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
            
            if tipo == 'casual' and not nome_do_recebedor:
                if is_ajax:
                    return JsonResponse({
                        'success': False,
                        'message': 'O campo "Nome do Recebedor" é obrigatório.',
                        'field': 'casual_recebedor'
                    }, status=400)
                messages.error(request, 'O campo "Nome do Recebedor" é obrigatório.')
                return redirect('/solicitacoes/home/')
            
            if not descricao:
                if is_ajax:
                    field_name = 'casual_description' if tipo == 'casual' else 'route_description'
                    return JsonResponse({
                        'success': False,
                        'message': 'O campo "Descrição" é obrigatório.',
                        'field': field_name
                    }, status=400)
                messages.error(request, 'O campo "Descrição" é obrigatório.')
                return redirect('/solicitacoes/home/')
                
            if not data_de_pagamento_str:
                if is_ajax:
                    field_name = 'casual_dataPagamento' if tipo == 'casual' else 'route_dataPagamento'
                    return JsonResponse({
                        'success': False,
                        'message': 'O campo "Data de Pagamento" é obrigatório.',
                        'field': field_name
                    }, status=400)
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
                # Coletar todos os itens da rota (IDs dinâmicos)
                itens_rota = []
                valor_total = 0.0
                ticket_principal = None
                
                # Coletar todos os IDs dinamicamente (não apenas 1-4)
                # Verificar todos os campos route_id_N no POST
                route_ids_encontrados = []
                for key in request.POST.keys():
                    if key.startswith('route_id_'):
                        # Extrair o número do ID (ex: route_id_5 -> 5)
                        try:
                            num_id = int(key.replace('route_id_', ''))
                            route_ids_encontrados.append(num_id)
                        except ValueError:
                            continue
                
                # Ordenar para processar na ordem correta
                route_ids_encontrados.sort()
                print(f"🔍 DEBUG Em Rota - IDs encontrados: {route_ids_encontrados}")
                
                ordem_atual = 1
                recebedor_principal = ''
                chave_pix_principal = ''
                cliente_empresa_principal = ''
                cnpj_principal = ''
                for i in route_ids_encontrados:
                    route_id = request.POST.get(f'route_id_{i}', '').strip()
                    route_valor_raw = request.POST.get(f'route_valor_{i}', '').strip()
                    route_servico_id = request.POST.get(f'route_servico_{i}', '').strip()
                    route_recebedor = request.POST.get(f'route_recebedor_{i}', '').strip()
                    route_pix = request.POST.get(f'route_pix_{i}', '').strip()
                    route_cliente_empresa = request.POST.get(f'route_cliente_empresa_{i}', '').strip()
                    route_cnpj = request.POST.get(f'route_cnpj_{i}', '').strip()
                    
                    if route_id and not route_recebedor:
                        messages.error(request, f'Informe o recebedor para o ID {route_id}.')
                        return redirect('/solicitacoes/home/')
                    
                    if not recebedor_principal and route_recebedor:
                        recebedor_principal = route_recebedor
                    if not chave_pix_principal and route_pix:
                        chave_pix_principal = route_pix
                    if not cliente_empresa_principal and route_cliente_empresa:
                        cliente_empresa_principal = route_cliente_empresa
                    if not cnpj_principal and route_cnpj:
                        cnpj_principal = route_cnpj
                    
                    # Registrar recebedor para uso futuro
                    if route_recebedor:
                        registrar_recebedor(route_recebedor, route_pix)
                    
                    # Capturar valores detalhados para cada ID
                    valor_km = limpar_valor_monetario(request.POST.get(f'route_valor_km_{i}', '').strip())
                    valor_pedagio = limpar_valor_monetario(request.POST.get(f'route_valor_pedagio_{i}', '').strip())
                    valor_hospedagem = limpar_valor_monetario(request.POST.get(f'route_valor_hospedagem_{i}', '').strip())
                    valor_fluvial = limpar_valor_monetario(request.POST.get(f'route_valor_fluvial_{i}', '').strip())
                    valor_outros = limpar_valor_monetario(request.POST.get(f'route_valor_outros_{i}', '').strip())
                    
                    print(f"🔍 DEBUG Em Rota - Item {i} (ordem {ordem_atual}): ID='{route_id}', Valor='{route_valor_raw}', Servico='{route_servico_id}'")
                    
                    if route_id:  # Se há ID, deve ter serviço (valor é opcional)
                        # Validação: se ID está preenchido, serviço é obrigatório
                        if not route_servico_id:
                            messages.error(request, f'Para o ID {route_id}, o campo "Serviço" é obrigatório.')
                            return redirect('/solicitacoes/home/')
                        
                        # Limpar valor - mesmo tratamento do Casual (opcional)
                        valor_item = limpar_valor_monetario(route_valor_raw) if route_valor_raw else 0.0
                        print(f"🔍 DEBUG Em Rota - Item {i} valor processado: {valor_item}")
                        
                        # Se não há valor de atividade, calcular a partir dos valores detalhados
                        if valor_item <= 0:
                            valor_detalhados = valor_km + valor_pedagio + valor_hospedagem + valor_fluvial + valor_outros
                            if valor_detalhados > 0:
                                valor_item = valor_detalhados
                                print(f"🔍 DEBUG Em Rota - Item {i} valor calculado a partir dos detalhados: {valor_item}")
                            else:
                                # Se não há valor de atividade nem valores detalhados, permitir mas com valor 0
                                print(f"⚠️ DEBUG Em Rota - Item {i} sem valor de atividade nem valores detalhados")
                                valor_item = 0.0
                        
                        # Verificar se pelo menos um valor (atividade ou detalhados) foi preenchido
                        total_valores = valor_item + valor_km + valor_pedagio + valor_hospedagem + valor_fluvial + valor_outros
                        if total_valores <= 0:
                            messages.error(request, f'Para o ID {route_id}, preencha pelo menos um valor (Atividade ou algum custo adicional).')
                            return redirect('/solicitacoes/home/')
                        
                        # Buscar serviço
                        servico_obj = None
                        if route_servico_id:
                            try:
                                servico_obj = Servico.objects.get(id=route_servico_id, ativo=True)
                            except Servico.DoesNotExist:
                                messages.error(request, f'Serviço selecionado para o ID {route_id} não foi encontrado ou está inativo.')
                                return redirect('/solicitacoes/home/')
                        
                        if ordem_atual == 1:
                            ticket_principal = route_id
                        
                        itens_rota.append({
                            'ticket': route_id,
                            'valor': valor_item,
                            'servico': servico_obj,
                            'ordem': ordem_atual,
                            'recebedor': route_recebedor,
                            'chave_pix': route_pix,
                            'cliente_empresa': route_cliente_empresa,
                            'cnpj': route_cnpj,
                            'valor_km': valor_km,
                            'valor_pedagio': valor_pedagio,
                            'valor_hospedagem': valor_hospedagem,
                            'valor_fluvial': valor_fluvial,
                            'valor_outros': valor_outros
                        })
                        valor_total += valor_item
                        ordem_atual += 1
                
                if len(itens_rota) < 1:
                    messages.error(request, 'Solicitação Em Rota precisa de no mínimo 1 item preenchido.')
                    return redirect('/solicitacoes/home/')
                
                nome_do_recebedor = recebedor_principal.strip()
                if not nome_do_recebedor:
                    messages.error(request, 'Informe pelo menos um recebedor nos itens da solicitação Em Rota.')
                    return redirect('/solicitacoes/home/')
                
                if not ticket_principal:
                    ticket_principal = itens_rota[0]['ticket']
                
                # ⚠️ VALIDAÇÃO: Verificar se algum ID da rota já existe no banco de dados
                tickets_rota = [item['ticket'] for item in itens_rota if item['ticket']]
                tickets_existentes = []
                for ticket in tickets_rota:
                    consulta_solic = Solicitacoes.objects.filter(ticket=ticket)
                    if is_edit_mode:
                        consulta_solic = consulta_solic.exclude(id=solicitacao_existente.id)
                    if consulta_solic.exists():
                        solicitacao_conflitante = consulta_solic.first()
                        if solicitacao_conflitante:
                            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                            tipo_existente = tipo_dict.get(solicitacao_conflitante.tipo, solicitacao_conflitante.tipo)
                            tickets_existentes.append(f"{ticket} (Solicitação {tipo_existente})")
                        else:
                            tickets_existentes.append(f"{ticket} (Solicitação)")
                        continue
                    
                    consulta_itens = SolicitacaoRotaItem.objects.filter(ticket_item=ticket)
                    if is_edit_mode:
                        consulta_itens = consulta_itens.exclude(solicitacao=solicitacao_existente)
                    if consulta_itens.exists():
                        item_existente = consulta_itens.first()
                        if item_existente and item_existente.solicitacao:
                            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                            tipo_existente = tipo_dict.get(item_existente.solicitacao.tipo, item_existente.solicitacao.tipo)
                            tickets_existentes.append(f"{ticket} (Item de rota {tipo_existente})")
                        else:
                            tickets_existentes.append(f"{ticket} (Item de rota)")
                
                if tickets_existentes:
                    tickets_str = ", ".join(tickets_existentes)
                    messages.error(
                        request, 
                        f'⚠️ Os seguintes IDs já estão cadastrados no sistema: {tickets_str}. '
                        f'Por favor, use IDs diferentes para os itens da rota.'
                    )
                    print(f"❌ ERRO: IDs já existem no banco de dados: {tickets_existentes}")
                    return redirect('/solicitacoes/home/')
                
                route_tickets = [item['ticket'] for item in itens_rota]
                titulo = f"Solicitação Em Rota - {', '.join(route_tickets)}"
                
                ticket_fallback = f"ROTA-{timezone.now().timestamp()}"
                if is_edit_mode and solicitacao_existente.ticket:
                    ticket_fallback = solicitacao_existente.ticket
                ticket_final = ticket_principal or ticket_fallback
                
                print(f"🔍 DEBUG Salvando solicitação Em Rota:")
                print(f"   - Ticket final: {ticket_final}")
                print(f"   - Valor Total: {valor_total}")
                print(f"   - Itens: {len(itens_rota)}")
                print(f"   - Modo edição: {is_edit_mode}")
                
                itens_para_criar = []
                for item in itens_rota:
                    itens_para_criar.append(SolicitacaoRotaItem(
                        solicitacao=None,  # Definido após obter a solicitação
                        ticket_item=item['ticket'],
                        valor=item['valor'],
                        servico=item['servico'],
                        ordem=item['ordem'],
                        recebedor=item.get('recebedor', ''),
                        chave_pix=item.get('chave_pix', ''),
                        cliente_empresa=item.get('cliente_empresa', ''),
                        cnpj=item.get('cnpj', ''),
                        valor_km=item.get('valor_km', 0.0),
                        valor_pedagio=item.get('valor_pedagio', 0.0),
                        valor_hospedagem=item.get('valor_hospedagem', 0.0),
                        valor_fluvial=item.get('valor_fluvial', 0.0),
                        valor_outros=item.get('valor_outros', 0.0)
                    ))
                
                with transaction.atomic():
                    if is_edit_mode:
                        solicitacao = solicitacao_existente
                        print(f"🔍 DEBUG EDIÇÃO EM ROTA - Valores antes do save:")
                        print(f"   - Valor Total: {valor_total} (anterior: {solicitacao.valor})")
                        print(f"   - Valor Receita: {valor_receita} (anterior: {solicitacao.valor_receita})")
                        print(f"   - Número de itens: {len(itens_rota)}")
                        solicitacao.ticket = ticket_final
                        solicitacao.titulo = titulo
                        solicitacao.nome_do_recebedor = nome_do_recebedor
                        solicitacao.valor = valor_total
                        solicitacao.descricao = descricao
                        solicitacao.data_de_pagamento = data_de_pagamento
                        solicitacao.prioridade = prioridade
                        solicitacao.servico = itens_rota[0]['servico']
                        solicitacao.tipo = 'em_rota'
                        solicitacao.valor_km = valor_km
                        solicitacao.valor_pedagio = valor_pedagio
                        solicitacao.valor_hospedagem = valor_hospedagem
                        solicitacao.valor_fluvial = valor_fluvial
                        solicitacao.valor_outros = valor_outros
                        solicitacao.valor_receita = valor_receita
                        solicitacao.valor_em_rota = valor_em_rota
                        solicitacao.descricao_em_rota = descricao_em_rota
                        solicitacao.chave_pix = chave_pix_principal or None
                        solicitacao.cliente_empresa = cliente_empresa_principal or None
                        solicitacao.cnpj = cnpj_principal or None
                        if anexo:
                            solicitacao.anexo = anexo
                        solicitacao.save()
                        print(f"✅ DEBUG EDIÇÃO EM ROTA - Solicitação salva com sucesso! ID: {solicitacao.id}")
                        solicitacao.itens_rota.all().delete()
                    else:
                        # Se criar com status aprovado ou concluido, preencher data_aprovacao
                        agora = timezone.now()
                        data_aprovacao_inicial = None
                        if status in ['aprovado', 'concluido']:
                            data_aprovacao_inicial = agora
                        
                        solicitacao = Solicitacoes.objects.create(
                            ticket=ticket_final,
                            status=status,
                            titulo=titulo,
                            nome_solicitante=request.user,
                            nome_do_recebedor=nome_do_recebedor,
                            chave_pix=chave_pix_principal or None,
                            cliente_empresa=cliente_empresa_principal or None,
                            cnpj=cnpj_principal or None,
                            valor=valor_total,
                            descricao=descricao,
                            data_de_pagamento=data_de_pagamento,
                            data_de_criacao=timezone.now().date(),
                            anexo=anexo,
                            tempo_criacao=tempo_criacao_auto,
                            tempo_fila=tempo_fila_inicial,
                            data_entrada_status=agora,
                            data_aprovacao=data_aprovacao_inicial,
                            prioridade=prioridade,
                            servico=itens_rota[0]['servico'],
                            tipo='em_rota',
                            valor_km=valor_km,
                            valor_pedagio=valor_pedagio,
                            valor_hospedagem=valor_hospedagem,
                            valor_fluvial=valor_fluvial,
                            valor_outros=valor_outros,
                            valor_receita=valor_receita,
                            valor_em_rota=valor_em_rota,
                            descricao_em_rota=descricao_em_rota
                        )
                    
                    for item in itens_para_criar:
                        item.solicitacao = solicitacao
                    SolicitacaoRotaItem.objects.bulk_create(itens_para_criar)
                
            else:
                # Processar solicitação Casual (original)
                id = request.POST.get('casual_id', '').strip()
                valor_raw = request.POST.get('casual_valor', '').strip()
                servico_id = request.POST.get('casual_service', '').strip()
                
                print(f"🔍 DEBUG Casual - ID='{id}', Valor='{valor_raw}', Servico='{servico_id}'")
                
                # ⚠️ VALIDAÇÃO: Verificar se o ID (ticket) já existe no banco de dados
                if id:
                    consulta_solic = Solicitacoes.objects.filter(ticket=id)
                    if is_edit_mode:
                        consulta_solic = consulta_solic.exclude(id=solicitacao_existente.id)
                    if consulta_solic.exists():
                        solicitacao_conf = consulta_solic.first()
                        if solicitacao_conf:
                            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                            tipo_existente = tipo_dict.get(solicitacao_conf.tipo, solicitacao_conf.tipo)
                            messages.error(
                                request, 
                                f'⚠️ O ID "{id}" já está cadastrado no sistema como solicitação "{tipo_existente}"! '
                                f'Por favor, use um ID diferente.'
                            )
                        else:
                            messages.error(
                                request, 
                                f'⚠️ O ID "{id}" já está cadastrado no sistema! '
                                f'Por favor, use um ID diferente.'
                            )
                        print(f"❌ ERRO: ID '{id}' já existe no banco de dados!")
                        return redirect('/solicitacoes/home/')
                    
                    consulta_item = SolicitacaoRotaItem.objects.filter(ticket_item=id)
                    if is_edit_mode:
                        consulta_item = consulta_item.exclude(solicitacao=solicitacao_existente)
                    if consulta_item.exists():
                        item_existente = consulta_item.first()
                        if item_existente and item_existente.solicitacao:
                            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                            tipo_existente = tipo_dict.get(item_existente.solicitacao.tipo, item_existente.solicitacao.tipo)
                            messages.error(
                                request, 
                                f'⚠️ O ID "{id}" já está cadastrado como item de rota em uma solicitação "{tipo_existente}"! '
                                f'Por favor, use um ID diferente.'
                            )
                        else:
                            messages.error(
                                request, 
                                f'⚠️ O ID "{id}" já está cadastrado como item de rota em outra solicitação! '
                                f'Por favor, use um ID diferente.'
                            )
                        print(f"❌ ERRO: ID '{id}' já existe como item de rota!")
                        return redirect('/solicitacoes/home/')
                
                # Limpar valor usando função auxiliar
                valor = limpar_valor_monetario(valor_raw)
                print(f"🔍 DEBUG Casual - Valor recebido do formulário: '{valor_raw}' -> processado: {valor}")
                
                # Se o valor for 0 ou não foi calculado, calcular a partir dos valores detalhados
                if valor == 0.0 or not valor_raw or valor_raw.strip() == '':
                    # Calcular valor total a partir dos valores detalhados + receita
                    valor_calculado = (
                        valor_km + valor_pedagio + valor_hospedagem + 
                        valor_fluvial + valor_outros + valor_receita
                    )
                    print(f"🔍 DEBUG Casual - Valores detalhados: KM={valor_km}, Pedágio={valor_pedagio}, Hospedagem={valor_hospedagem}, Fluvial={valor_fluvial}, Outros={valor_outros}, Receita={valor_receita}")
                    print(f"🔍 DEBUG Casual - Valor calculado a partir dos detalhados: {valor_calculado}")
                    
                    if valor_calculado > 0:
                        valor = valor_calculado
                        print(f"🔍 DEBUG - Valor recalculado a partir dos detalhados: {valor}")
                    else:
                        messages.error(request, 'O valor total da solicitação deve ser maior que zero. Preencha pelo menos um valor detalhado ou o valor de receita.')
                        print(f"❌ ERRO - Valor calculado é zero ou negativo: {valor_calculado}")
                        return redirect('/solicitacoes/home/')
                
                print(f"🔍 DEBUG - Valor final processado: {valor}")
                
                # Validação: valor deve ser maior que zero
                if valor <= 0:
                    messages.error(request, 'O valor total da solicitação deve ser maior que zero.')
                    print(f"❌ ERRO - Valor final é zero ou negativo: {valor}")
                    return redirect('/solicitacoes/home/')
                
                # Buscar o objeto Servico pelo ID
                servico_obj = None
                if servico_id:
                    try:
                        servico_obj = Servico.objects.get(id=servico_id, ativo=True)
                    except Servico.DoesNotExist:
                        messages.warning(request, f'Serviço selecionado não encontrado ou inativo.')
                
                # Gerar título e ticket
                titulo = f"Solicitação Casual - {id}" if id else "Solicitação Casual"
                ticket_fallback = f'CASUAL-{timezone.now().timestamp()}'
                if is_edit_mode and solicitacao_existente.ticket:
                    ticket_fallback = solicitacao_existente.ticket
                ticket_final = id if id else ticket_fallback
                
                print(f"🔍 DEBUG Salvando solicitação Casual:")
                print(f"   - ID/Ticket: {ticket_final}")
                print(f"   - Valor: {valor}")
                print(f"   - Serviço: {servico_obj}")
                print(f"   - Tipo: casual")
                print(f"   - Modo edição: {is_edit_mode}")
                
                try:
                    with transaction.atomic():
                        if is_edit_mode:
                            solicitacao = solicitacao_existente
                            print(f"🔍 DEBUG EDIÇÃO CASUAL - Valores antes do save:")
                            print(f"   - Valor: {valor} (anterior: {solicitacao.valor})")
                            print(f"   - Valor Receita: {valor_receita} (anterior: {solicitacao.valor_receita})")
                            print(f"   - Valor KM: {valor_km} (anterior: {solicitacao.valor_km})")
                            print(f"   - Recebedor: {nome_do_recebedor} (anterior: {solicitacao.nome_do_recebedor})")
                            solicitacao.ticket = ticket_final
                            solicitacao.titulo = titulo
                            solicitacao.nome_do_recebedor = nome_do_recebedor
                            solicitacao.chave_pix = chave_pix_casual or None
                            solicitacao.cliente_empresa = cliente_empresa_casual or None
                            solicitacao.cnpj = cnpj_casual or None
                            solicitacao.valor = valor
                            solicitacao.descricao = descricao
                            solicitacao.data_de_pagamento = data_de_pagamento
                            solicitacao.prioridade = prioridade
                            solicitacao.servico = servico_obj
                            solicitacao.tipo = 'casual'
                            solicitacao.valor_km = valor_km
                            solicitacao.valor_pedagio = valor_pedagio
                            solicitacao.valor_hospedagem = valor_hospedagem
                            solicitacao.valor_fluvial = valor_fluvial
                            solicitacao.valor_outros = valor_outros
                            solicitacao.valor_receita = valor_receita
                            solicitacao.valor_em_rota = 0.0
                            solicitacao.descricao_em_rota = ''
                            if anexo:
                                solicitacao.anexo = anexo
                            solicitacao.save()
                            print(f"✅ DEBUG EDIÇÃO CASUAL - Solicitação salva com sucesso! ID: {solicitacao.id}")
                            print(f"✅ DEBUG EDIÇÃO CASUAL - Valores após save: Valor={solicitacao.valor}, Receita={solicitacao.valor_receita}")
                            # Garantir que itens anteriores (se existirem) sejam removidos
                            solicitacao.itens_rota.all().delete()
                        else:
                            # Se criar com status aprovado ou concluido, preencher data_aprovacao
                            agora = timezone.now()
                            data_aprovacao_inicial = None
                            if status in ['aprovado', 'concluido']:
                                data_aprovacao_inicial = agora
                            
                            solicitacao = Solicitacoes.objects.create(
                                ticket=ticket_final,
                                status=status,
                                titulo=titulo,
                                nome_solicitante=request.user,
                                nome_do_recebedor=nome_do_recebedor,
                                chave_pix=chave_pix_casual or None,
                                cliente_empresa=cliente_empresa_casual or None,
                                cnpj=cnpj_casual or None,
                                valor=valor,
                                descricao=descricao,
                                data_de_pagamento=data_de_pagamento,
                                data_de_criacao=timezone.now().date(),
                                anexo=anexo,
                                tempo_criacao=tempo_criacao_auto,
                                tempo_fila=tempo_fila_inicial,
                                data_entrada_status=agora,
                                data_aprovacao=data_aprovacao_inicial,
                                prioridade=prioridade,
                                servico=servico_obj,
                                tipo='casual',
                                valor_km=valor_km,
                                valor_pedagio=valor_pedagio,
                                valor_hospedagem=valor_hospedagem,
                                valor_fluvial=valor_fluvial,
                                valor_outros=valor_outros,
                                valor_receita=valor_receita,
                                valor_em_rota=0.0,
                                descricao_em_rota=''
                            )
                    
                    print(f"✅ Solicitação Casual salva com sucesso! ID: {solicitacao.id}, Ticket: {solicitacao.ticket}")
                except Exception as e:
                    print(f"❌ ERRO ao salvar solicitação Casual: {e}")
                    messages.error(request, f'Erro ao salvar solicitação Casual: {str(e)}')
                    return redirect('/solicitacoes/home/')
            
            # Verificar se é requisição AJAX
            is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
            
            if is_ajax:
                # Retornar JSON para requisições AJAX
                return JsonResponse({
                    'success': True,
                    'message': success_message
                })
            
            messages.success(request, success_message)
            print(f"✅ DEBUG EDIÇÃO - Mensagem de sucesso enviada: {success_message}")
            if is_edit_mode:
                print(f"✅ DEBUG EDIÇÃO - Redirecionando após edição. Solicitação ID: {solicitacao_existente.id if solicitacao_existente else 'N/A'}")
            # Redirect para a mesma página para recarregar e mostrar o novo card
            return redirect('/solicitacoes/home/')
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"❌ ERRO GERAL ao processar solicitação: {str(e)}")
            print(f"📋 Traceback completo:\n{error_trace}")
            
            # Verificar se é requisição AJAX
            is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': f'Erro ao criar solicitação: {str(e)}'
                }, status=500)
            
            messages.error(request, f'Erro ao criar solicitação: {str(e)}')
            return redirect('/solicitacoes/home/')
    
    elif request.method == 'GET':
        """
        Verifica se o usuário que está dentro da requisição está autenticado, 
        se sim ele retorna e renderiza a página de home.
        Se não, retorna e redireciona para a área do login.
        """
        if request.user.is_authenticated:
            # Buscar as solicitações normalmente (migração já foi garantida no início da função)
            try:
                # Otimização: Buscar todas as solicitações de uma vez
                # e usar select_related e prefetch_related para otimizar queries
                todas_solicitacoes = Solicitacoes.objects.select_related('nome_solicitante', 'servico').prefetch_related('itens_rota__servico').all()
                
                solicitacoes_por_status = {
                    'pendente': [],
                    'recusado': [],
                    'aprovado': [],
                    'concluido': [],
                }
                
                objetos_para_corrigir = []
                for solicitacao in todas_solicitacoes:
                    status_normalizado = normalizar_status(solicitacao.status)
                    
                    # Ajustar o objeto em memória para manter consistência na renderização
                    if solicitacao.status != status_normalizado:
                        print(f"⚠️ Normalizando status da solicitação {solicitacao.id} ({solicitacao.ticket}): '{solicitacao.status}' -> '{status_normalizado}'")
                        solicitacao.status = status_normalizado
                        objetos_para_corrigir.append(solicitacao)
                    
                    solicitacoes_por_status.setdefault(status_normalizado, []).append(solicitacao)
                
                if objetos_para_corrigir:
                    Solicitacoes.objects.bulk_update(objetos_para_corrigir, ['status'])
                
                solicitacoes_pendentes = solicitacoes_por_status['pendente']
                solicitacoes_recusados = solicitacoes_por_status['recusado']
                solicitacoes_aprovado = solicitacoes_por_status['aprovado']
                solicitacoes_concluido = solicitacoes_por_status['concluido']
                
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
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"❌ Erro ao buscar solicitações: {str(e)}")
                print(f"📋 Traceback:\n{error_trace}")
                # Retornar página vazia ao invés de erro
                return render(request, 'home/index.html', {
                    'solicitacoes_pendentes': [],
                    'num_solicitacoes_pendentes': 0,
                    'solicitacoes_recusados': [],
                    'num_solicitacoes_recusados': 0,
                    'solicitacoes_aprovado': [],
                    'num_solicitacoes_aprovado': 0,
                    'solicitacoes_concluido': [],
                    'num_solicitacoes_concluido': 0,
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
        
        # Serializar os itens com valores detalhados
        itens_data = []
        for item in itens:
            # Calcular valor da atividade para cada item
            # IMPORTANTE: item.valor já é o valor da atividade (não o valor total)
            valor_atividade_item = item.valor or 0.0
            
            itens_data.append({
                'ordem': item.ordem,
                'id': item.ticket_item,
                'valor': f'R$ {item.valor:.2f}',
                'servico': item.servico.nome if item.servico else 'N/A',
                'recebedor': item.recebedor or '',
                'chave_pix': item.chave_pix or '',
                'cliente_empresa': item.cliente_empresa or '',
                'cnpj': item.cnpj or '',
                'valor_km': f'R$ {item.valor_km:.2f}',
                'valor_pedagio': f'R$ {item.valor_pedagio:.2f}',
                'valor_hospedagem': f'R$ {item.valor_hospedagem:.2f}',
                'valor_fluvial': f'R$ {item.valor_fluvial:.2f}',
                'valor_outros': f'R$ {item.valor_outros:.2f}',
                'valor_total_item': f'R$ {item.valor:.2f}',
                'valor_atividade': f'R$ {valor_atividade_item:.2f}'  # Adicionar valor da atividade calculado
            })
        
        # Calcular valor total apenas com valores detalhados (sem atividade)
        valor_total_detalhados = solicitacao.get_valor_detalhados()
        
        # Calcular valor da receita como soma das atividades de todos os itens
        # IMPORTANTE: item.valor já é o valor da atividade (não o valor total)
        # Então basta somar todos os item.valor
        valor_receita_calculado = 0.0
        for item in itens:
            # item.valor já é o valor da atividade, não precisa subtrair nada
            valor_atividade_item = item.valor or 0.0
            valor_receita_calculado += valor_atividade_item
        
        return JsonResponse({
            'success': True,
            'itens': itens_data,
            'valor_total': f'R$ {valor_total_detalhados:.2f}',
            'valor_receita': f'R$ {valor_receita_calculado:.2f}',
            'valor_em_rota': f'R$ {solicitacao.valor_em_rota:.2f}',
            'descricao_em_rota': solicitacao.descricao_em_rota or ''
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

@require_http_methods(["GET"])
def obter_valores_detalhados_casual(request, solicitacao_id):
    """
    View para obter os valores detalhados de uma solicitação Casual via AJAX
    """
    try:
        solicitacao = Solicitacoes.objects.select_related('servico').get(id=solicitacao_id)
        
        # Verificar se é uma solicitação "Casual"
        if solicitacao.tipo != 'casual':
            return JsonResponse({
                'success': False,
                'message': 'Esta solicitação não é do tipo "Casual"'
            }, status=400)
        
        # Calcular valor total apenas com valores detalhados (sem atividade)
        valor_total_detalhados = solicitacao.get_valor_detalhados()
        
        # Calcular valor da receita como valor da atividade (valor_total - soma_detalhados)
        # O valor da receita é SOMENTE o valor da atividade, não o valor salvo no banco
        soma_detalhados_casual = (solicitacao.valor_km or 0.0) + (solicitacao.valor_pedagio or 0.0) + \
                                 (solicitacao.valor_hospedagem or 0.0) + (solicitacao.valor_fluvial or 0.0) + \
                                 (solicitacao.valor_outros or 0.0)
        valor_total_casual = solicitacao.valor or 0.0
        valor_receita_calculado = 0.0
        if valor_total_casual > soma_detalhados_casual:
            valor_receita_calculado = valor_total_casual - soma_detalhados_casual
        
        # Serializar os valores detalhados
        valores_detalhados = {
            'valor_km': f'R$ {solicitacao.valor_km:.2f}',
            'valor_pedagio': f'R$ {solicitacao.valor_pedagio:.2f}',
            'valor_hospedagem': f'R$ {solicitacao.valor_hospedagem:.2f}',
            'valor_fluvial': f'R$ {solicitacao.valor_fluvial:.2f}',
            'valor_outros': f'R$ {solicitacao.valor_outros:.2f}',
            'valor_receita': f'R$ {valor_receita_calculado:.2f}',  # Usar valor calculado, não o salvo
            'valor_total': f'R$ {valor_total_detalhados:.2f}',
            'servico': solicitacao.servico.nome if solicitacao.servico else 'N/A'
        }
        
        return JsonResponse({
            'success': True,
            'valores': valores_detalhados
        })
        
    except Solicitacoes.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Solicitação não encontrada'
        }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao obter valores detalhados: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def obter_detalhes_completos(request, solicitacao_id):
    """
    View para obter detalhes completos de uma solicitação (para relatório)
    Inclui todos os valores detalhados e informações completas
    """
    try:
        solicitacao = Solicitacoes.objects.select_related('servico', 'nome_solicitante').prefetch_related('itens_rota__servico').get(id=solicitacao_id)
        
        # Informações básicas
        dados = {
            'id': solicitacao.id,
            'ticket': solicitacao.ticket,
            'titulo': solicitacao.titulo,
            'solicitante': str(solicitacao.nome_solicitante),
            'recebedor': solicitacao.nome_do_recebedor,
            'chave_pix': solicitacao.chave_pix or '',
            'cliente_empresa': solicitacao.cliente_empresa or '',
            'cnpj': solicitacao.cnpj or '',
            'servico': solicitacao.servico.nome if solicitacao.servico else 'N/A',
            'servico_id': solicitacao.servico.id if solicitacao.servico else None,
            'tipo': solicitacao.tipo,
            'status': solicitacao.status,
            'prioridade': solicitacao.prioridade,
            'descricao': solicitacao.descricao or 'N/A',
            'data_criacao': solicitacao.data_de_criacao.strftime('%d/%m/%Y') if solicitacao.data_de_criacao else 'N/A',
            'data_pagamento': solicitacao.data_de_pagamento.strftime('%d/%m/%Y') if solicitacao.data_de_pagamento else 'N/A',
            'data_criacao_iso': solicitacao.data_de_criacao.isoformat() if solicitacao.data_de_criacao else '',
            'data_pagamento_iso': solicitacao.data_de_pagamento.isoformat() if solicitacao.data_de_pagamento else '',
            'valor_total': f'R$ {solicitacao.valor:.2f}',
            'valor_total_raw': float(solicitacao.valor or 0),
            # Calcular valor_receita a partir das atividades (não usar o valor salvo)
            'valor_receita': '',  # Será calculado abaixo
            'valor_receita_raw': 0.0,  # Será calculado abaixo
            'valor_em_rota': f'R$ {solicitacao.valor_em_rota:.2f}',
            'valor_em_rota_raw': float(solicitacao.valor_em_rota or 0),
            'descricao_em_rota': solicitacao.descricao_em_rota or '',
            # Valores detalhados (sempre presentes)
            'valor_km': f'R$ {solicitacao.valor_km:.2f}',
            'valor_km_raw': float(solicitacao.valor_km or 0),
            'valor_pedagio': f'R$ {solicitacao.valor_pedagio:.2f}',
            'valor_pedagio_raw': float(solicitacao.valor_pedagio or 0),
            'valor_hospedagem': f'R$ {solicitacao.valor_hospedagem:.2f}',
            'valor_hospedagem_raw': float(solicitacao.valor_hospedagem or 0),
            'valor_fluvial': f'R$ {solicitacao.valor_fluvial:.2f}',
            'valor_fluvial_raw': float(solicitacao.valor_fluvial or 0),
            'valor_outros': f'R$ {solicitacao.valor_outros:.2f}',
            'valor_outros_raw': float(solicitacao.valor_outros or 0),
        }
        
        # Calcular valor_receita a partir das atividades (não usar o valor salvo no banco)
        # Se for "Em Rota", incluir itens da rota e calcular receita
        if solicitacao.tipo == 'em_rota':
            # Para Em Rota: soma das atividades de todos os itens
            # IMPORTANTE: item.valor já é o valor da atividade (não o valor total)
            valor_receita_calculado = 0.0
            itens_rota = solicitacao.itens_rota.all().order_by('ordem')
            for item in itens_rota:
                # item.valor já é o valor da atividade, não precisa subtrair nada
                valor_atividade_item = item.valor or 0.0
                valor_receita_calculado += valor_atividade_item
            dados['valor_receita'] = f'R$ {valor_receita_calculado:.2f}'
            dados['valor_receita_raw'] = float(valor_receita_calculado)
            dados['itens_rota'] = []
            for item in itens_rota:
                dados['itens_rota'].append({
                    'ordem': item.ordem,
                    'ticket_item': item.ticket_item,
                    'servico': item.servico.nome if item.servico else 'N/A',
                    'servico_id': item.servico.id if item.servico else None,
                    'recebedor': item.recebedor or '',
                    'chave_pix': item.chave_pix or '',
                    'cliente_empresa': item.cliente_empresa or '',
                    'cnpj': item.cnpj or '',
                    'valor': f'R$ {item.valor:.2f}',
                    'valor_raw': float(item.valor or 0),
                    'valor_km': f'R$ {item.valor_km:.2f}',
                    'valor_km_raw': float(item.valor_km or 0),
                    'valor_pedagio': f'R$ {item.valor_pedagio:.2f}',
                    'valor_pedagio_raw': float(item.valor_pedagio or 0),
                    'valor_hospedagem': f'R$ {item.valor_hospedagem:.2f}',
                    'valor_hospedagem_raw': float(item.valor_hospedagem or 0),
                    'valor_fluvial': f'R$ {item.valor_fluvial:.2f}',
                    'valor_fluvial_raw': float(item.valor_fluvial or 0),
                    'valor_outros': f'R$ {item.valor_outros:.2f}',
                    'valor_outros_raw': float(item.valor_outros or 0),
                })
        else:
            # Para Casual: valor_total - soma_detalhados
            soma_detalhados_casual = (solicitacao.valor_km or 0.0) + (solicitacao.valor_pedagio or 0.0) + \
                                     (solicitacao.valor_hospedagem or 0.0) + (solicitacao.valor_fluvial or 0.0) + \
                                     (solicitacao.valor_outros or 0.0)
            valor_total_casual = solicitacao.valor or 0.0
            valor_receita_calculado = 0.0
            if valor_total_casual > soma_detalhados_casual:
                valor_receita_calculado = valor_total_casual - soma_detalhados_casual
            dados['valor_receita'] = f'R$ {valor_receita_calculado:.2f}'
            dados['valor_receita_raw'] = float(valor_receita_calculado)
        
        return JsonResponse({
            'success': True,
            'dados': dados
        })
        
    except Solicitacoes.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Solicitação não encontrada'
        }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao obter detalhes: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def exportar_relatorio_card(request, solicitacao_id):
    """
    View para exportar relatório detalhado de uma solicitação em nova guia
    """
    try:
        solicitacao = Solicitacoes.objects.prefetch_related('itens_rota__servico').get(id=solicitacao_id)
        
        # Calcular valores
        valor_total_detalhados = solicitacao.get_valor_detalhados()
        valor_receita_calculado = 0.0
        
        # Se for Em Rota, calcular receita e preparar itens
        itens_rota_data = []
        if solicitacao.tipo == 'em_rota':
            itens = solicitacao.itens_rota.all().order_by('ordem')
            for item in itens:
                # IMPORTANTE: item.valor já é o valor da atividade (não o valor total)
                valor_atividade_item = item.valor or 0.0
                valor_receita_calculado += valor_atividade_item
                
                # Calcular soma dos detalhados apenas para exibição
                soma_detalhados_item = (item.valor_km or 0.0) + (item.valor_pedagio or 0.0) + \
                                       (item.valor_hospedagem or 0.0) + (item.valor_fluvial or 0.0) + \
                                       (item.valor_outros or 0.0)
                valor_total_item = valor_atividade_item + soma_detalhados_item
                
                itens_rota_data.append({
                    'ordem': item.ordem,
                    'ticket_item': item.ticket_item,
                    'servico': item.servico.nome if item.servico else 'N/A',
                    'recebedor': item.recebedor or '',
                    'chave_pix': item.chave_pix or '',
                    'cliente_empresa': item.cliente_empresa or '',
                    'cnpj': item.cnpj or '',
                    'valor_total': valor_total_item,
                    'valor_km': item.valor_km or 0.0,
                    'valor_pedagio': item.valor_pedagio or 0.0,
                    'valor_hospedagem': item.valor_hospedagem or 0.0,
                    'valor_fluvial': item.valor_fluvial or 0.0,
                    'valor_outros': item.valor_outros or 0.0,
                    'soma_detalhados': soma_detalhados_item,
                    'valor_atividade': valor_atividade_item,
                })
        else:
            # Para Casual, calcular receita como valor da atividade (valor_total - soma_detalhados)
            # O valor da receita é SOMENTE o valor da atividade, não o valor salvo no banco
            soma_detalhados_casual = (solicitacao.valor_km or 0.0) + (solicitacao.valor_pedagio or 0.0) + \
                                     (solicitacao.valor_hospedagem or 0.0) + (solicitacao.valor_fluvial or 0.0) + \
                                     (solicitacao.valor_outros or 0.0)
            valor_total_casual = solicitacao.valor or 0.0
            if valor_total_casual > soma_detalhados_casual:
                valor_receita_calculado = valor_total_casual - soma_detalhados_casual
        
        context = {
            'solicitacao': solicitacao,
            'valor_total_detalhados': valor_total_detalhados,
            'valor_receita': valor_receita_calculado,  # Usar valor calculado, não o salvo
            'itens_rota': itens_rota_data,
            'data_exportacao': timezone.now(),
        }
        
        return render(request, 'solicitacoes/relatorio_card.html', context)
        
    except Solicitacoes.DoesNotExist:
        messages.error(request, 'Solicitação não encontrada')
        return redirect('/solicitacoes/home/')
        
    except Exception as e:
        messages.error(request, f'Erro ao gerar relatório: {str(e)}')
        return redirect('/solicitacoes/home/')
 
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
        status_db = normalizar_status(status_mapping.get(new_status, new_status))
        
        # Buscar e atualizar solicitação
        from django.utils import timezone
        solicitacao = Solicitacoes.objects.get(id=card_id)
        status_anterior = solicitacao.status
        agora = timezone.now()
        
        # Se o status mudou, atualizar data_entrada_status
        if status_anterior != status_db:
            solicitacao.data_entrada_status = agora
        
        # Registrar momento exato da aprovação para manter a métrica mesmo após outras mudanças
        if status_db == 'aprovado' and not solicitacao.data_aprovacao:
            solicitacao.data_aprovacao = agora
        elif status_db == 'concluido' and not solicitacao.data_aprovacao:
            # Alguns fluxos podem pular direto para concluído; registramos a aprovação no mesmo instante
            solicitacao.data_aprovacao = agora
        
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

@require_http_methods(["GET"])
def buscar_recebedores(request):
    """
    View para buscar recebedores via AJAX
    Retorna lista de recebedores ativos para preencher datalist
    Pode buscar por ID específico ou por nome
    """
    try:
        query = request.GET.get('q', '').strip()
        recebedor_id = request.GET.get('id', '').strip()
        
        # Se há ID específico, buscar apenas esse recebedor
        if recebedor_id:
            try:
                recebedor = Recebedor.objects.get(id=int(recebedor_id))
                recebedores_list = [{
                    'id': recebedor.id,
                    'nome': recebedor.nome,
                    'chave_pix': recebedor.chave_pix,
                    'supervisor': recebedor.supervisor or '',
                    'ativo': recebedor.ativo
                }]
            except (Recebedor.DoesNotExist, ValueError):
                recebedores_list = []
        else:
            recebedores = Recebedor.objects.all()
            
            if query:
                # Buscar por nome (inclui inativos se houver query)
                recebedores = recebedores.filter(nome__icontains=query)
            else:
                # Se não há query, retornar apenas ativos
                recebedores = recebedores.filter(ativo=True)
            
            recebedores_list = [
                {
                    'id': r.id,
                    'nome': r.nome,
                    'chave_pix': r.chave_pix,
                    'supervisor': r.supervisor or '',
                    'ativo': r.ativo
                }
                for r in recebedores[:20]  # Limitar a 20 resultados
            ]
        
        return JsonResponse({
            'success': True,
            'recebedores': recebedores_list
        })
    except Exception as e:
        print(f"❌ Erro ao buscar recebedores: {e}")
        return JsonResponse({
            'success': False,
            'recebedores': [],
            'message': str(e)
        }, status=500)

@require_http_methods(["GET"])
def buscar_clientes_empresas(request):
    """
    View para buscar clientes/empresas via AJAX
    Retorna lista de clientes/empresas ativos para preencher datalist
    Pode buscar por ID específico ou por nome
    """
    try:
        query = request.GET.get('q', '').strip()
        cliente_id = request.GET.get('id', '').strip()
        
        # Se há ID específico, buscar apenas esse cliente
        if cliente_id:
            try:
                cliente = ClienteEmpresa.objects.get(id=int(cliente_id))
                clientes_list = [{
                    'id': cliente.id,
                    'nome': cliente.nome,
                    'cnpj': cliente.cnpj or '',
                    'ativo': cliente.ativo
                }]
            except (ClienteEmpresa.DoesNotExist, ValueError):
                clientes_list = []
        else:
            clientes = ClienteEmpresa.objects.all()
            
            if query:
                # Buscar por nome (inclui inativos se houver query)
                clientes = clientes.filter(nome__icontains=query)
            else:
                # Se não há query, retornar apenas ativos
                clientes = clientes.filter(ativo=True)
            
            clientes_list = [
                {
                    'id': c.id,
                    'nome': c.nome,
                    'cnpj': c.cnpj or '',
                    'ativo': c.ativo
                }
                for c in clientes[:20]  # Limitar a 20 resultados
            ]
        
        return JsonResponse({
            'success': True,
            'clientes_empresas': clientes_list
        })
    except Exception as e:
        print(f"❌ Erro ao buscar clientes/empresas: {e}")
        return JsonResponse({
            'success': False,
            'clientes_empresas': [],
            'message': str(e)
        }, status=500)
@require_http_methods(["POST"])
def excluir_solicitacao(request, solicitacao_id):
    """
    View para excluir uma solicitação individual
    Apenas usuários do grupo Financeiro podem executar esta ação
    E apenas para solicitações recusadas
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'Não autenticado'
        }, status=401)
    
    # Verificar permissão: apenas Financeiro pode excluir solicitações
    from usuarios.decorators import user_is_financeiro
    if not user_is_financeiro(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Apenas membros do grupo Financeiro podem excluir solicitações.'
        }, status=403)
    
    try:
        # Buscar a solicitação
        solicitacao = Solicitacoes.objects.get(id=solicitacao_id)
        
        # Verificar se é recusada
        if solicitacao.status != 'recusado':
            return JsonResponse({
                'success': False,
                'message': 'Apenas solicitações recusadas podem ser excluídas.'
            }, status=400)
        
        ticket = solicitacao.ticket
        solicitacao.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Solicitação #{ticket} excluída com sucesso!'
        })
        
    except Solicitacoes.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Solicitação não encontrada.'
        }, status=404)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': f'Erro ao excluir solicitação: {str(e)}'
        }, status=500)

@require_http_methods(["POST"])
def excluir_solicitacoes_recusadas(request):
    """
    View para excluir todas as solicitações recusadas
    Apenas usuários do grupo Financeiro podem executar esta ação
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'Não autenticado'
        }, status=401)
    
    # Verificar permissão: apenas Financeiro pode excluir solicitações recusadas
    from usuarios.decorators import user_is_financeiro
    if not user_is_financeiro(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Apenas membros do grupo Financeiro podem excluir solicitações recusadas.'
        }, status=403)
    
    try:
        # Buscar todas as solicitações recusadas
        solicitacoes_recusadas = Solicitacoes.objects.filter(status='recusado')
        quantidade = solicitacoes_recusadas.count()
        
        if quantidade == 0:
            return JsonResponse({
                'success': True,
                'message': 'Não há solicitações recusadas para excluir.',
                'quantidade': 0
            })
        
        # Excluir todas as solicitações recusadas
        solicitacoes_recusadas.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'{quantidade} solicitação(ões) recusada(s) excluída(s) com sucesso!',
            'quantidade': quantidade
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': f'Erro ao excluir solicitações: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def verificar_id_existente(request):
    """
    View para verificar se um ID (ticket) já está cadastrado no sistema.
    Usado para validação em tempo real no formulário.
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'existe': False,
            'message': 'Não autenticado'
        }, status=401)
    
    ticket = request.GET.get('ticket', '').strip()
    solicitacao_id = request.GET.get('solicitacao_id', '').strip()  # Para modo edição
    
    if not ticket:
        return JsonResponse({
            'existe': False,
            'message': 'ID não fornecido'
        })
    
    try:
        # Verificar se existe como ticket principal em Solicitacoes
        consulta_solic = Solicitacoes.objects.filter(ticket=ticket)
        if solicitacao_id:
            try:
                consulta_solic = consulta_solic.exclude(id=int(solicitacao_id))
            except (ValueError, TypeError):
                pass
        
        if consulta_solic.exists():
            solicitacao_existente = consulta_solic.first()
            tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
            tipo_existente = tipo_dict.get(solicitacao_existente.tipo, solicitacao_existente.tipo)
            status_existente = solicitacao_existente.status
            
            return JsonResponse({
                'existe': True,
                'tipo': 'solicitacao',
                'message': f'O ID "{ticket}" já está cadastrado como solicitação "{tipo_existente}" (Status: {status_existente}).',
                'detalhes': {
                    'tipo': tipo_existente,
                    'status': status_existente,
                    'titulo': solicitacao_existente.titulo
                }
            })
        
        # Verificar se existe como ticket_item em SolicitacaoRotaItem
        consulta_item = SolicitacaoRotaItem.objects.filter(ticket_item=ticket)
        if solicitacao_id:
            try:
                consulta_item = consulta_item.exclude(solicitacao_id=int(solicitacao_id))
            except (ValueError, TypeError):
                pass
        
        if consulta_item.exists():
            item_existente = consulta_item.first()
            if item_existente and item_existente.solicitacao:
                tipo_dict = dict(Solicitacoes.TIPO_CHOICES)
                tipo_existente = tipo_dict.get(item_existente.solicitacao.tipo, item_existente.solicitacao.tipo)
                
                return JsonResponse({
                    'existe': True,
                    'tipo': 'item_rota',
                    'message': f'O ID "{ticket}" já está cadastrado como item de rota em uma solicitação "{tipo_existente}".',
                    'detalhes': {
                        'tipo': tipo_existente,
                        'solicitacao_titulo': item_existente.solicitacao.titulo
                    }
                })
        
        # ID não encontrado
        return JsonResponse({
            'existe': False,
            'message': 'ID disponível'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'existe': False,
            'message': f'Erro ao verificar ID: {str(e)}'
        }, status=500)
