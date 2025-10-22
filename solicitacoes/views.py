from django.shortcuts import render

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
        return render(request, 'index.html')