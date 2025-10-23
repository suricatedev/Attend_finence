from django.shortcuts import render,redirect

def receber_dados(request):
    if request.method == 'POST':
        status = request.POST.get('status')
        titulo = request.POST.get('title')  
        nome_solicitante = request.POST.get('solicitante')  
        id = request.POST.get('id')
        nome_do_recebedor = request.POST.get('recebedor')  
        valor = request.POST.get('valor')
        descricao = request.POST.get('description') 
        data_de_pagamento = request.POST.get('dataPagamento')  
        data_de_criacao = request.POST.get('dataCriacao')  
        anexo = request.POST.get('anexos')  
        tempo_criacao = request.POST.get('tempoCriacao') 
        tempo_fila = request.POST.get('tempoFila')  
        prioridade = request.POST.get('priority') 
        servico = request.POST.get('service') 
    
    elif request.method == 'GET':
        """

            Verifica se o usuario que está dentro da requsição esta autenticado, se sim ele retorna e renderiza a pagina de home.
            Se não, retorna e rediriciona para a área do login.

        """
        if request.user.is_authenticated:
            return render(request, 'index.html')
        else:
            return redirect('login')