"""
Script para popular o banco de dados com dados de exemplo
Execute com: python manage.py shell < populate_db.py
"""

import os
import django
from datetime import datetime, timedelta, time
from django.contrib.auth.models import User

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attend_finence.settings')
django.setup()

from solicitacoes.models import Solicitacoes

def criar_usuario_teste():
    """Cria um usuário de teste se não existir"""
    try:
        user = User.objects.get(username='admin')
        print(f"✅ Usuário 'admin' já existe")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='admin',
            email='admin@exemplo.com',
            password='admin123',
            first_name='Administrador',
            last_name='Sistema'
        )
        print(f"✅ Usuário 'admin' criado com sucesso")
    return user

def limpar_solicitacoes():
    """Limpa todas as solicitações existentes"""
    count = Solicitacoes.objects.all().count()
    if count > 0:
        resposta = input(f"❓ Existem {count} solicitações no banco. Deseja limpar? (s/n): ")
        if resposta.lower() == 's':
            Solicitacoes.objects.all().delete()
            print(f"✅ {count} solicitações removidas")
        else:
            print("❌ Operação cancelada")
            return False
    return True

def criar_solicitacoes_exemplo():
    """Cria solicitações de exemplo"""
    user = criar_usuario_teste()
    
    if not limpar_solicitacoes():
        return
    
    hoje = datetime.now().date()
    
    # Dados de exemplo
    solicitacoes_data = [
        # PENDENTES
        {
            'ticket': 'TK-001',
            'status': 'pendente',
            'titulo': 'Consultoria em Infraestrutura de Rede',
            'nome_do_recebedor': 'João Silva',
            'valor': 5500.00,
            'descricao': 'Consultoria para otimização da infraestrutura de rede corporativa',
            'data_de_pagamento': hoje + timedelta(days=30),
            'data_de_criacao': hoje - timedelta(days=2),
            'tempo_criacao': time(14, 30, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'alta',
            'servico': 'consultoria_TI'
        },
        {
            'ticket': 'TK-002',
            'status': 'pendente',
            'titulo': 'Desenvolvimento de Sistema de Gestão',
            'nome_do_recebedor': 'Maria Santos',
            'valor': 12000.00,
            'descricao': 'Desenvolvimento de sistema para gestão de estoque e vendas',
            'data_de_pagamento': hoje + timedelta(days=45),
            'data_de_criacao': hoje - timedelta(days=5),
            'tempo_criacao': time(10, 15, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'alta',
            'servico': 'desenvolvimento'
        },
        {
            'ticket': 'TK-003',
            'status': 'pendente',
            'titulo': 'Manutenção Preventiva de Servidores',
            'nome_do_recebedor': 'Carlos Oliveira',
            'valor': 3200.00,
            'descricao': 'Manutenção preventiva dos servidores da empresa',
            'data_de_pagamento': hoje + timedelta(days=15),
            'data_de_criacao': hoje - timedelta(days=1),
            'tempo_criacao': time(9, 0, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'media',
            'servico': 'manutencao_equipamentos'
        },
        
        # RECUSADOS
        {
            'ticket': 'TK-004',
            'status': 'recusado',
            'titulo': 'Treinamento em Cybersegurança',
            'nome_do_recebedor': 'Ana Paula',
            'valor': 8500.00,
            'descricao': 'Treinamento corporativo em segurança da informação',
            'data_de_pagamento': hoje + timedelta(days=20),
            'data_de_criacao': hoje - timedelta(days=10),
            'tempo_criacao': time(15, 45, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'baixa',
            'servico': 'treinamento_corporativo'
        },
        {
            'ticket': 'TK-005',
            'status': 'recusado',
            'titulo': 'Upgrade de Hardware',
            'nome_do_recebedor': 'Pedro Costa',
            'valor': 15000.00,
            'descricao': 'Upgrade completo de hardware dos computadores',
            'data_de_pagamento': hoje + timedelta(days=10),
            'data_de_criacao': hoje - timedelta(days=8),
            'tempo_criacao': time(11, 20, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'media',
            'servico': 'manutencao_equipamentos'
        },
        
        # APROVADOS
        {
            'ticket': 'TK-006',
            'status': 'aprovado',
            'titulo': 'Consultoria em Cloud Computing',
            'nome_do_recebedor': 'Fernanda Lima',
            'valor': 9800.00,
            'descricao': 'Consultoria para migração de sistemas para nuvem',
            'data_de_pagamento': hoje + timedelta(days=25),
            'data_de_criacao': hoje - timedelta(days=15),
            'tempo_criacao': time(13, 10, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'alta',
            'servico': 'consultoria_TI'
        },
        {
            'ticket': 'TK-007',
            'status': 'aprovado',
            'titulo': 'Desenvolvimento de App Mobile',
            'nome_do_recebedor': 'Roberto Mendes',
            'valor': 18500.00,
            'descricao': 'Desenvolvimento de aplicativo mobile para vendas',
            'data_de_pagamento': hoje + timedelta(days=60),
            'data_de_criacao': hoje - timedelta(days=12),
            'tempo_criacao': time(16, 30, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'alta',
            'servico': 'desenvolvimento'
        },
        {
            'ticket': 'TK-008',
            'status': 'aprovado',
            'titulo': 'Treinamento em Python',
            'nome_do_recebedor': 'Juliana Rocha',
            'valor': 4500.00,
            'descricao': 'Treinamento em desenvolvimento Python para equipe',
            'data_de_pagamento': hoje + timedelta(days=20),
            'data_de_criacao': hoje - timedelta(days=7),
            'tempo_criacao': time(14, 0, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'media',
            'servico': 'treinamento_corporativo'
        },
        
        # CONCLUÍDOS
        {
            'ticket': 'TK-009',
            'status': 'concluido',
            'titulo': 'Manutenção de Impressoras',
            'nome_do_recebedor': 'Marcos Souza',
            'valor': 1200.00,
            'descricao': 'Manutenção preventiva das impressoras do escritório',
            'data_de_pagamento': hoje - timedelta(days=5),
            'data_de_criacao': hoje - timedelta(days=30),
            'tempo_criacao': time(10, 0, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'baixa',
            'servico': 'manutencao_equipamentos'
        },
        {
            'ticket': 'TK-010',
            'status': 'concluido',
            'titulo': 'Consultoria em SEO',
            'nome_do_recebedor': 'Beatriz Alves',
            'valor': 3800.00,
            'descricao': 'Consultoria para otimização de mecanismos de busca',
            'data_de_pagamento': hoje - timedelta(days=10),
            'data_de_criacao': hoje - timedelta(days=45),
            'tempo_criacao': time(11, 30, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'media',
            'servico': 'consultoria_TI'
        },
        {
            'ticket': 'TK-011',
            'status': 'concluido',
            'titulo': 'Desenvolvimento de Dashboard Analytics',
            'nome_do_recebedor': 'Gabriel Ferreira',
            'valor': 7500.00,
            'descricao': 'Desenvolvimento de dashboard para análise de dados',
            'data_de_pagamento': hoje - timedelta(days=3),
            'data_de_criacao': hoje - timedelta(days=60),
            'tempo_criacao': time(15, 0, 0),
            'tempo_fila': time(0, 0, 0),
            'prioridade': 'alta',
            'servico': 'desenvolvimento'
        },
    ]
    
    print("\n📝 Criando solicitações de exemplo...\n")
    
    criadas = 0
    for dados in solicitacoes_data:
        try:
            solicitacao = Solicitacoes.objects.create(
                nome_solicitante=user,
                **dados
            )
            print(f"✅ Criada: {solicitacao.ticket} - {solicitacao.titulo} ({solicitacao.status})")
            criadas += 1
        except Exception as e:
            print(f"❌ Erro ao criar {dados['ticket']}: {e}")
    
    print(f"\n🎉 Total: {criadas} solicitações criadas com sucesso!")
    
    # Estatísticas
    print("\n📊 Estatísticas:")
    print(f"   Pendentes: {Solicitacoes.objects.filter(status='pendente').count()}")
    print(f"   Recusadas: {Solicitacoes.objects.filter(status='recusado').count()}")
    print(f"   Aprovadas: {Solicitacoes.objects.filter(status='aprovado').count()}")
    print(f"   Concluídas: {Solicitacoes.objects.filter(status='concluido').count()}")
    print(f"   TOTAL: {Solicitacoes.objects.all().count()}")
    
    print("\n✅ Banco de dados populado com sucesso!")
    print("\n💡 Dicas:")
    print("   - Usuário: admin")
    print("   - Senha: admin123")
    print("   - Acesse: http://localhost:8000/solicitacoes/home/")

if __name__ == '__main__':
    criar_solicitacoes_exemplo()

