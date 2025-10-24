from django.shortcuts import render, redirect
from django.contrib import messages
from .models import Solicitacoes
from django.utils import timezone

def receber_dados(request):
    if request.method == 'POST':
        try:
            # Capturar dados do POST
            id_externo = request.POST.get('id')
            status = request.POST.get('status')
            titulo = request.POST.get('title')  
            solicitante_nome = request.POST.get('solicitante')
            nome_do_recebedor = request.POST.get('recebedor')  
            valor = request.POST.get('valor')
            descricao = request.POST.get('description') 
            data_de_pagamento = request.POST.get('dataPagamento')  
            data_de_criacao = request.POST.get('dataCriacao')  
            tempo_criacao = request.POST.get('tempoCriacao') 
            tempo_fila = request.POST.get('tempoFila')  
            prioridade = request.POST.get('priority') 
            servico = request.POST.get('service')

            # Captura de arquivos
            anexo = request.FILES.get('anexos')
            
            # Criar e salvar no banco
            solicitacao = Solicitacoes.objects.create(
                status=status,
                titulo=titulo,
                nome_solicitante=request.user,  # Usuário logado
                nome_do_recebedor=nome_do_recebedor,
                valor=float(valor),
                descricao=descricao,
                data_de_pagamento=data_de_pagamento,
                data_de_criacao=data_de_criacao or timezone.now().date(),
                anexo=anexo,
                tempo_criacao=tempo_criacao,
                tempo_fila=tempo_fila,
                prioridade=prioridade,
                servico=servico
            )
            
            # Nota: O ID externo (id_externo) e nome do solicitante (solicitante_nome) 
            # são capturados mas não salvos no modelo atual
            # Se necessário, adicione esses campos ao modelo Solicitacoes
            
            messages.success(request, 'Solicitação criada com sucesso!')
            return redirect('home')
            
        except Exception as e:
            messages.error(request, f'Erro ao criar solicitação: {str(e)}')
            return render(request, 'index.html')
    
    elif request.method == 'GET':
        """
        Verifica se o usuário que está dentro da requisição está autenticado, 
        se sim ele retorna e renderiza a página de home.
        Se não, retorna e redireciona para a área do login.
        """
        if request.user.is_authenticated:
            solicitacoes = Solicitacoes.objects.all().order_by('-data_de_criacao')
            return render(request, 'index.html', {
                'solicitacoes': solicitacoes
            })
        else:
            return redirect('login')
