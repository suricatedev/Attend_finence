from django.shortcuts import render,redirect
from .models import Solicitacoes
from django.utils import timezone

def receber_dados(request):
    if request.method == 'POST':
        status = request.POST.get('status')
        titulo = request.POST.get('title')  
        nome_solicitante = request.POST.get('solicitante')  
        nome_do_recebedor = request.POST.get('recebedor')  
        valor = request.POST.get('valor')
        descricao = request.POST.get('description') 
        data_de_pagamento = request.POST.get('dataPagamento')  
        data_de_criacao = request.POST.get('dataCriacao')  
        
        tempo_criacao = request.POST.get('tempoCriacao') 
        tempo_fila = request.POST.get('tempoFila')  
        prioridade = request.POST.get('priority') 
        servico = request.POST.get('service')


        #Captura de arquivos. 
        anexo = request.FILES.get('anexos')
        
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
        return redirect('home')

    elif request.method == 'GET':
        """

            Verifica se o usuario que está dentro da requsição esta autenticado, se sim ele retorna e renderiza a pagina de home.
            Se não, retorna e rediriciona para a área do login.

        """
        if request.user.is_authenticated:
            return render(request, 'index.html')
        else:
            return redirect('login')