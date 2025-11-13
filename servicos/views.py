from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import transaction
import json
from io import StringIO
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
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
        # Verificar se o campo supervisor existe antes de ordenar
        from django.db import connection
        
        supervisor_exists = False
        try:
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA table_info(solicitacoes_recebedor)")
                columns = [row[1] for row in cursor.fetchall()]
                supervisor_exists = 'supervisor' in columns
        except Exception as e:
            print(f"⚠️ Erro ao verificar colunas: {e}")
            supervisor_exists = False
        
        # Ordenar baseado na existência do campo
        if supervisor_exists:
            recebedores_list = Recebedor.objects.all().order_by('supervisor', 'nome')
        else:
            recebedores_list = Recebedor.objects.all().order_by('nome')
        
        total_recebedores = recebedores_list.count()
        recebedores_ativos = recebedores_list.filter(ativo=True).count()
        
        # Agrupar recebedores por supervisor
        recebedores_por_supervisor = {}
        try:
            for recebedor in recebedores_list:
                # Verificar se o campo supervisor existe usando hasattr
                if hasattr(recebedor, 'supervisor'):
                    supervisor_key = recebedor.supervisor if recebedor.supervisor else 'sem_supervisor'
                else:
                    supervisor_key = 'sem_supervisor'
                
                if supervisor_key not in recebedores_por_supervisor:
                    recebedores_por_supervisor[supervisor_key] = []
                recebedores_por_supervisor[supervisor_key].append(recebedor)
        except Exception as e:
            # Se houver erro (campo supervisor não existe ainda), usar lista simples
            print(f"⚠️ Erro ao agrupar por supervisor: {e}")
            recebedores_por_supervisor = {'sem_supervisor': list(recebedores_list)}
        
        # Buscar clientes/empresas
        clientes_empresas_list = ClienteEmpresa.objects.all().order_by('nome')
        total_clientes_empresas = clientes_empresas_list.count()
        clientes_empresas_ativos = clientes_empresas_list.filter(ativo=True).count()
        
        return render(request, 'servicos.html', {
            'servicos': servicos_list,
            'total_servicos': total_servicos,
            'servicos_ativos': servicos_ativos,
            'recebedores': recebedores_list,
            'recebedores_por_supervisor': recebedores_por_supervisor,
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
            supervisor = data.get('supervisor', '').strip() or None
            ativo_str = data.get('ativo', 'true')
        else:
            # FormData
            nome = request.POST.get('nome', '').strip()
            chave_pix = request.POST.get('chave_pix', '').strip()
            supervisor = request.POST.get('supervisor', '').strip() or None
            ativo_str = request.POST.get('ativo', 'true')
        
        ativo = ativo_str.lower() == 'true' if isinstance(ativo_str, str) else bool(ativo_str)
        
        if not nome:
            return JsonResponse({'success': False, 'error': 'O nome do recebedor é obrigatório'})
        
        if not chave_pix:
            return JsonResponse({'success': False, 'error': 'A chave PIX é obrigatória'})
        
        # Verificar se já existe recebedor com mesmo nome
        if Recebedor.objects.filter(nome__iexact=nome).exists():
            return JsonResponse({'success': False, 'error': f'Já existe um recebedor com o nome "{nome}"'})
        
        # Criar recebedor, verificando se o campo supervisor existe
        recebedor_data = {
            'nome': nome,
            'chave_pix': chave_pix,
            'ativo': ativo
        }
        # Adicionar supervisor apenas se o campo existir
        try:
            if 'supervisor' in [f.name for f in Recebedor._meta.get_fields()]:
                recebedor_data['supervisor'] = supervisor
        except Exception:
            pass  # Se não conseguir verificar, não adicionar supervisor
        
        recebedor = Recebedor.objects.create(**recebedor_data)
        
        return JsonResponse({
            'success': True,
            'message': f'Recebedor "{nome}" criado com sucesso!',
            'recebedor': {
                'id': recebedor.id,
                'nome': recebedor.nome,
                'chave_pix': recebedor.chave_pix,
                'supervisor': getattr(recebedor, 'supervisor', None) or '',
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
            supervisor = data.get('supervisor', '').strip() or None
            ativo_str = data.get('ativo', 'true')
        else:
            # FormData
            nome = request.POST.get('nome', '').strip()
            chave_pix = request.POST.get('chave_pix', '').strip()
            supervisor = request.POST.get('supervisor', '').strip() or None
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
        
        # Atualizar supervisor apenas se o campo existir
        try:
            if hasattr(recebedor, 'supervisor'):
                recebedor.supervisor = supervisor
        except Exception:
            pass  # Se não conseguir verificar, não atualizar supervisor
        
        recebedor.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Recebedor "{nome}" atualizado com sucesso!',
            'recebedor': {
                'id': recebedor.id,
                'nome': recebedor.nome,
                'chave_pix': recebedor.chave_pix,
                'supervisor': getattr(recebedor, 'supervisor', None) or '',
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

@require_http_methods(["POST"])
def importar_recebedores(request):
    """View para importar recebedores de uma planilha Excel ou CSV"""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Não autenticado'}, status=401)
    
    if not PANDAS_AVAILABLE:
        return JsonResponse({
            'success': False, 
            'error': 'Biblioteca pandas não está instalada. Execute: pip install pandas openpyxl'
        }, status=400)
    
    try:
        if 'arquivo' not in request.FILES:
            return JsonResponse({'success': False, 'error': 'Nenhum arquivo foi enviado'})
        
        arquivo = request.FILES['arquivo']
        
        # Verificar extensão do arquivo
        nome_arquivo = arquivo.name.lower()
        if not (nome_arquivo.endswith('.xlsx') or nome_arquivo.endswith('.xls') or nome_arquivo.endswith('.csv')):
            return JsonResponse({'success': False, 'error': 'Formato de arquivo não suportado. Use Excel (.xlsx, .xls) ou CSV (.csv)'})
        
        # Ler o arquivo
        try:
            if nome_arquivo.endswith('.csv'):
                # Ler CSV - tentar diferentes encodings comuns para arquivos brasileiros
                # Lista de encodings para tentar, em ordem de preferência
                encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'windows-1252']
                df = None
                ultimo_erro = None
                
                # Ler o conteúdo do arquivo em bytes primeiro
                arquivo.seek(0)
                conteudo_bytes = arquivo.read()
                arquivo.seek(0)
                
                # Tentar cada encoding
                for encoding in encodings:
                    try:
                        # Criar um objeto StringIO a partir do conteúdo em bytes
                        conteudo_str = conteudo_bytes.decode(encoding)
                        arquivo_string = StringIO(conteudo_str)
                        df = pd.read_csv(arquivo_string)
                        break  # Se conseguiu ler, sair do loop
                    except (UnicodeDecodeError, UnicodeError) as e:
                        ultimo_erro = e
                        continue
                    except Exception as e:
                        # Outros erros podem ser de parsing, não de encoding
                        ultimo_erro = e
                        continue
                
                # Se nenhum encoding funcionou, tentar com errors='ignore' ou 'replace'
                if df is None:
                    try:
                        # Tentar com utf-8 ignorando erros
                        conteudo_str = conteudo_bytes.decode('utf-8', errors='replace')
                        arquivo_string = StringIO(conteudo_str)
                        df = pd.read_csv(arquivo_string)
                    except Exception:
                        # Última tentativa com latin-1
                        try:
                            conteudo_str = conteudo_bytes.decode('latin-1', errors='replace')
                            arquivo_string = StringIO(conteudo_str)
                            df = pd.read_csv(arquivo_string)
                        except Exception as e:
                            return JsonResponse({
                                'success': False, 
                                'error': f'Erro ao ler arquivo CSV. Não foi possível decodificar o arquivo. Tente salvar o arquivo como UTF-8 ou Excel (.xlsx). Erro: {str(ultimo_erro)}'
                            })
            else:
                # Ler Excel
                arquivo.seek(0)  # Resetar posição do arquivo
                df = pd.read_excel(arquivo)
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'Erro ao ler arquivo: {str(e)}'})
        
        if df.empty:
            return JsonResponse({'success': False, 'error': 'A planilha está vazia'})
        
        # Normalizar nomes das colunas (remover espaços, converter para minúsculas)
        df.columns = df.columns.str.strip().str.lower()
        
        # Procurar colunas de nome, chave PIX e supervisor
        nome_col = None
        pix_col = None
        supervisor_col = None
        
        # Possíveis nomes de colunas
        possiveis_nomes = ['nome', 'recebedor', 'name', 'recebedor nome']
        possiveis_pix = ['chave pix', 'chavepix', 'pix', 'chave_pix', 'chave', 'key pix']
        possiveis_supervisor = ['supervisor', 'supervisores', 'supervisor nome', 'super']
        
        for col in df.columns:
            col_lower = col.lower().strip()
            if col_lower in possiveis_nomes and nome_col is None:
                nome_col = col
            if col_lower in possiveis_pix and pix_col is None:
                pix_col = col
            if col_lower in possiveis_supervisor and supervisor_col is None:
                supervisor_col = col
        
        if nome_col is None:
            return JsonResponse({'success': False, 'error': 'Coluna "Nome" não encontrada na planilha'})
        
        if pix_col is None:
            return JsonResponse({'success': False, 'error': 'Coluna "Chave PIX" não encontrada na planilha'})
        
        # Processar linhas
        recebedores_criados = 0
        recebedores_atualizados = 0
        erros = []
        
        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    nome = str(row[nome_col]).strip() if pd.notna(row[nome_col]) else ''
                    chave_pix = str(row[pix_col]).strip() if pd.notna(row[pix_col]) else ''
                    
                    # Processar supervisor
                    supervisor = None
                    if supervisor_col:
                        supervisor_val = str(row[supervisor_col]).strip() if pd.notna(row[supervisor_col]) else ''
                        # Normalizar valores de supervisor
                        supervisor_val_lower = supervisor_val.lower()
                        # Aceitar tanto os nomes antigos quanto os novos
                        if ('supervisor 1' in supervisor_val_lower or supervisor_val_lower == '1' or 
                            supervisor_val_lower == 'supervisor1' or 
                            'nayron' in supervisor_val_lower or 'januario' in supervisor_val_lower):
                            supervisor = 'supervisor1'
                        elif ('supervisor 2' in supervisor_val_lower or supervisor_val_lower == '2' or 
                              supervisor_val_lower == 'supervisor2' or
                              'flavio' in supervisor_val_lower or 'medina' in supervisor_val_lower):
                            supervisor = 'supervisor2'
                    
                    # Pular linhas vazias
                    if not nome or not chave_pix:
                        continue
                    
                    # Preparar defaults, verificando se o campo supervisor existe
                    defaults = {
                        'nome': nome,
                        'chave_pix': chave_pix,
                        'ativo': True
                    }
                    # Adicionar supervisor apenas se o campo existir
                    try:
                        if 'supervisor' in [f.name for f in Recebedor._meta.get_fields()]:
                            defaults['supervisor'] = supervisor
                    except Exception:
                        pass  # Se não conseguir verificar, não adicionar supervisor
                    
                    # Criar ou atualizar recebedor
                    recebedor, created = Recebedor.objects.update_or_create(
                        nome__iexact=nome,
                        defaults=defaults
                    )
                    
                    if created:
                        recebedores_criados += 1
                    else:
                        recebedores_atualizados += 1
                        
                except Exception as e:
                    erros.append(f'Linha {index + 2}: {str(e)}')
                    continue
        
        mensagem = f'Importação concluída! {recebedores_criados} recebedor(es) criado(s), {recebedores_atualizados} atualizado(s).'
        if erros:
            mensagem += f' {len(erros)} erro(s) encontrado(s).'
        
        return JsonResponse({
            'success': True,
            'message': mensagem,
            'criados': recebedores_criados,
            'atualizados': recebedores_atualizados,
            'erros': erros[:10]  # Limitar a 10 erros
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': f'Erro ao importar recebedores: {str(e)}'}, status=400)

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
