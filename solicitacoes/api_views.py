from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Sum, Max
from django.utils import timezone
from datetime import datetime, time
from .models import Solicitacoes, SolicitacaoRotaItem
from .serializers import (
    SolicitacoesSerializer,
    SolicitacoesCreateUpdateSerializer,
    SolicitacaoRotaItemSerializer
)
from .permissions import IsAdminUser


class SolicitacoesViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Solicitações Financeiras.
    
    Requer autenticação e permissão de Administrador.
    Permite criar, editar, listar e visualizar solicitações.
    """
    queryset = Solicitacoes.objects.select_related(
        'nome_solicitante', 'servico'
    ).prefetch_related('itens_rota').all()
    
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        """
        Retorna o serializer apropriado baseado na ação.
        Usa SolicitacoesCreateUpdateSerializer para create/update
        e SolicitacoesSerializer para read/list.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return SolicitacoesCreateUpdateSerializer
        return SolicitacoesSerializer
    
    def get_queryset(self):
        """
        Filtra o queryset baseado em parâmetros opcionais.
        """
        queryset = super().get_queryset()
        
        # Filtros opcionais
        status_filter = self.request.query_params.get('status', None)
        tipo_filter = self.request.query_params.get('tipo', None)
        solicitante_id = self.request.query_params.get('solicitante_id', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter.lower())
        
        if tipo_filter:
            queryset = queryset.filter(tipo=tipo_filter.lower())
        
        if solicitante_id:
            queryset = queryset.filter(nome_solicitante_id=solicitante_id)
        
        if data_inicio:
            try:
                data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
                queryset = queryset.filter(data_de_criacao__gte=data_inicio_obj)
            except ValueError:
                pass
        
        if data_fim:
            try:
                data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d').date()
                queryset = queryset.filter(data_de_criacao__lte=data_fim_obj)
            except ValueError:
                pass
        
        return queryset.order_by('-data_de_criacao', '-id')
    
    def create(self, request, *args, **kwargs):
        """
        Cria uma nova solicitação.
        Sobrescrito para preparar dados antes de validar e retornar serializer de leitura.
        """
        # Preparar dados antes de validar
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Gerar ticket se não fornecido
        if 'ticket' not in data or not data.get('ticket'):
            tipo = data.get('tipo', 'casual')
            data['ticket'] = self._gerar_ticket(tipo)
        
        # Definir nome_solicitante_id se não fornecido
        if 'nome_solicitante_id' not in data:
            data['nome_solicitante_id'] = request.user.id
        
        # Definir data_de_criacao se não fornecido
        if 'data_de_criacao' not in data:
            data['data_de_criacao'] = timezone.now().date().isoformat()
        
        # Definir tempo_criacao se não fornecido
        if 'tempo_criacao' not in data:
            data['tempo_criacao'] = timezone.now().time().isoformat()
        
        # Definir tempo_fila inicial se não fornecido
        if 'tempo_fila' not in data:
            data['tempo_fila'] = time(0, 0, 0).isoformat()
        
        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Criar a solicitação
        solicitacao = serializer.save()
        
        # Retornar resposta com serializer de leitura
        read_serializer = SolicitacoesSerializer(solicitacao, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """
        Atualiza uma solicitação existente.
        Só permite editar solicitações com status 'pendente'.
        """
        solicitacao = self.get_object()
        
        # Verificar se pode editar (apenas pendentes)
        if solicitacao.status != 'pendente':
            return Response(
                {
                    'error': 'Somente solicitações com status "pendente" podem ser editadas.',
                    'current_status': solicitacao.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(solicitacao, data=request.data, partial=False, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated_solicitacao = serializer.save()
        
        # Retornar resposta com serializer de leitura
        read_serializer = SolicitacoesSerializer(updated_solicitacao, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        """
        Atualiza parcialmente uma solicitação existente (PATCH).
        Só permite editar solicitações com status 'pendente'.
        """
        solicitacao = self.get_object()
        
        # Verificar se pode editar (apenas pendentes)
        if solicitacao.status != 'pendente':
            return Response(
                {
                    'error': 'Somente solicitações com status "pendente" podem ser editadas.',
                    'current_status': solicitacao.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(solicitacao, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated_solicitacao = serializer.save()
        
        # Retornar resposta com serializer de leitura
        read_serializer = SolicitacoesSerializer(updated_solicitacao, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        """
        Deleta uma solicitação.
        Por padrão, só permite deletar solicitações recusadas.
        Pode ser sobrescrito para permitir outras regras.
        """
        solicitacao = self.get_object()
        
        # Por padrão, só permite deletar recusadas (para segurança)
        if solicitacao.status != 'recusado':
            return Response(
                {
                    'error': 'Somente solicitações com status "recusado" podem ser deletadas.',
                    'current_status': solicitacao.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitacao.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'], url_path='detalhes-completos')
    def detalhes_completos(self, request, pk=None):
        """
        Retorna os detalhes completos de uma solicitação,
        incluindo todos os itens da rota se aplicável.
        """
        solicitacao = self.get_object()
        serializer = SolicitacoesSerializer(solicitacao, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='estatisticas')
    def estatisticas(self, request):
        """
        Retorna estatísticas das solicitações.
        """
        queryset = self.get_queryset()
        
        total = queryset.count()
        por_status = {}
        por_tipo = {}
        
        for status_val in ['pendente', 'aprovado', 'recusado', 'concluido']:
            por_status[status_val] = queryset.filter(status=status_val).count()
        
        for tipo_val in ['casual', 'em_rota']:
            por_tipo[tipo_val] = queryset.filter(tipo=tipo_val).count()
        
        valor_total = queryset.aggregate(
            total=Sum('valor')
        )['total'] or 0
        
        return Response({
            'total': total,
            'por_status': por_status,
            'por_tipo': por_tipo,
            'valor_total': float(valor_total)
        })
    
    def _gerar_ticket(self, tipo='casual'):
        """
        Gera um ticket único para a solicitação.
        """
        prefixo = 'ROTA-' if tipo == 'em_rota' else 'INC'
        
        # Buscar o último ticket do mesmo tipo
        ultimo_ticket = Solicitacoes.objects.filter(
            ticket__startswith=prefixo
        ).aggregate(Max('ticket'))['ticket__max']
        
        if ultimo_ticket:
            # Extrair o número do último ticket
            try:
                if prefixo == 'ROTA-':
                    numero = int(ultimo_ticket.replace('ROTA-', ''))
                else:
                    numero = int(ultimo_ticket.replace('INC', ''))
                novo_numero = numero + 1
            except ValueError:
                novo_numero = 1
        else:
            novo_numero = 1
        
        # Formatar o novo ticket
        if prefixo == 'ROTA-':
            novo_ticket = f'ROTA-{novo_numero:03d}'
        else:
            novo_ticket = f'INC{novo_numero:06d}'
        
        # Verificar se já existe (caso raro de concorrência)
        while Solicitacoes.objects.filter(ticket=novo_ticket).exists():
            novo_numero += 1
            if prefixo == 'ROTA-':
                novo_ticket = f'ROTA-{novo_numero:03d}'
            else:
                novo_ticket = f'INC{novo_numero:06d}'
        
        return novo_ticket

