from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Solicitacoes, SolicitacaoRotaItem
from servicos.models import Servico


class UserSerializer(serializers.ModelSerializer):
    """Serializer para o modelo User (solicitante)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']


class ServicoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Servico"""
    class Meta:
        model = Servico
        fields = ['id', 'nome']
        read_only_fields = ['id']


class SolicitacaoRotaItemSerializer(serializers.ModelSerializer):
    """Serializer para itens de uma solicitação Em Rota"""
    servico_nome = serializers.CharField(source='servico.nome', read_only=True, required=False)
    
    class Meta:
        model = SolicitacaoRotaItem
        fields = [
            'id', 'ticket_item', 'valor', 'servico', 'servico_nome',
            'ordem', 'recebedor', 'chave_pix', 'cliente_empresa', 'cnpj',
            'valor_km', 'valor_pedagio', 'valor_hospedagem', 
            'valor_fluvial', 'valor_outros'
        ]
        read_only_fields = ['id']
    
    def validate_servico(self, value):
        """Validação opcional para o serviço"""
        if value is None:
            return None
        return value


class SolicitacoesSerializer(serializers.ModelSerializer):
    """Serializer principal para o modelo Solicitacoes"""
    nome_solicitante = UserSerializer(read_only=True)
    nome_solicitante_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='nome_solicitante',
        write_only=True,
        required=False
    )
    servico_nome = serializers.CharField(source='servico.nome', read_only=True, required=False)
    itens_rota = SolicitacaoRotaItemSerializer(many=True, read_only=True)
    
    # Campos de URL para anexo
    anexo_url = serializers.SerializerMethodField()
    
    # Campos calculados
    valor_total_detalhados = serializers.SerializerMethodField()
    
    class Meta:
        model = Solicitacoes
        fields = [
            'id', 'ticket', 'status', 'titulo', 'nome_solicitante', 'nome_solicitante_id',
            'nome_do_recebedor', 'chave_pix', 'cliente_empresa', 'cnpj',
            'valor', 'descricao', 'data_de_pagamento', 'data_de_criacao',
            'anexo', 'anexo_url', 'tempo_criacao', 'tempo_fila',
            'data_entrada_status', 'data_aprovacao', 'prioridade',
            'servico', 'servico_nome', 'tipo',
            'valor_km', 'valor_pedagio', 'valor_hospedagem',
            'valor_fluvial', 'valor_outros', 'valor_receita',
            'valor_em_rota', 'descricao_em_rota',
            'itens_rota', 'valor_total_detalhados'
        ]
        read_only_fields = [
            'id', 'ticket', 'data_entrada_status', 'data_aprovacao',
            'valor_total_detalhados'
        ]
    
    def get_anexo_url(self, obj):
        """Retorna a URL completa do anexo se existir"""
        if obj.anexo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.anexo.url)
            return obj.anexo.url
        return None
    
    def get_valor_total_detalhados(self, obj):
        """Retorna o valor total dos detalhados"""
        return obj.get_valor_detalhados()
    
    def validate_titulo(self, value):
        """Validação do título"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("O título é obrigatório.")
        if len(value) > 70:
            raise serializers.ValidationError("O título não pode ter mais de 70 caracteres.")
        return value.strip()
    
    def validate_valor(self, value):
        """Validação do valor"""
        if value is None or value < 0:
            raise serializers.ValidationError("O valor deve ser maior ou igual a zero.")
        return value
    
    def validate_status(self, value):
        """Normaliza o status"""
        status_map = {
            'pendente': 'pendente',
            'aprovado': 'aprovado',
            'recusado': 'recusado',
            'concluido': 'concluido',
            'concluído': 'concluido',
        }
        return status_map.get(value.lower(), value.lower())
    
    def validate(self, attrs):
        """Validação geral do objeto"""
        # Se não foi fornecido nome_solicitante_id, usa o usuário autenticado
        if 'nome_solicitante' not in attrs and 'nome_solicitante_id' not in attrs:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                attrs['nome_solicitante'] = request.user
        
        # Validação para tipo Em Rota
        tipo = attrs.get('tipo', self.instance.tipo if self.instance else 'casual')
        if tipo == 'em_rota':
            # Para Em Rota, alguns campos podem ser opcionais
            pass
        else:
            # Para Casual, validar campos obrigatórios
            if not attrs.get('nome_do_recebedor'):
                raise serializers.ValidationError({
                    'nome_do_recebedor': 'O nome do recebedor é obrigatório para solicitações Casuais.'
                })
        
        return attrs


class SolicitacoesCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para criação e edição, incluindo criação de itens"""
    itens_rota = SolicitacaoRotaItemSerializer(many=True, required=False)
    nome_solicitante_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='nome_solicitante',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Solicitacoes
        fields = [
            'id', 'ticket', 'status', 'titulo', 'nome_solicitante_id',
            'nome_do_recebedor', 'chave_pix', 'cliente_empresa', 'cnpj',
            'valor', 'descricao', 'data_de_pagamento', 'data_de_criacao',
            'anexo', 'tempo_criacao', 'tempo_fila', 'prioridade',
            'servico', 'tipo',
            'valor_km', 'valor_pedagio', 'valor_hospedagem',
            'valor_fluvial', 'valor_outros', 'valor_receita',
            'valor_em_rota', 'descricao_em_rota',
            'itens_rota'
        ]
        read_only_fields = ['id', 'ticket']
    
    def validate(self, attrs):
        """Validação geral e lógica de criação"""
        # Se não foi fornecido nome_solicitante_id, usa o usuário autenticado
        if 'nome_solicitante' not in attrs:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                attrs['nome_solicitante'] = request.user
        
        # Validação para tipo Em Rota
        tipo = attrs.get('tipo', self.instance.tipo if self.instance else 'casual')
        if tipo == 'em_rota':
            # Validar que há itens se for Em Rota
            itens = attrs.get('itens_rota', [])
            if not itens and not self.instance:
                raise serializers.ValidationError({
                    'itens_rota': 'Solicitações Em Rota devem ter pelo menos um item.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Cria uma nova solicitação com seus itens"""
        itens_data = validated_data.pop('itens_rota', [])
        solicitacao = Solicitacoes.objects.create(**validated_data)
        
        # Criar itens da rota se houver
        for ordem, item_data in enumerate(itens_data, start=1):
            # Criar cópia do dict para não modificar o original
            item_dict = dict(item_data) if hasattr(item_data, 'items') else item_data.copy()
            item_dict['ordem'] = ordem
            SolicitacaoRotaItem.objects.create(solicitacao=solicitacao, **item_dict)
        
        return solicitacao
    
    def update(self, instance, validated_data):
        """Atualiza uma solicitação e seus itens"""
        itens_data = validated_data.pop('itens_rota', None)
        
        # Atualizar campos da solicitação
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Atualizar itens da rota se fornecidos
        if itens_data is not None:
            # Remover itens existentes
            instance.itens_rota.all().delete()
            # Criar novos itens
            for ordem, item_data in enumerate(itens_data, start=1):
                # Criar cópia do dict para não modificar o original
                item_dict = dict(item_data) if hasattr(item_data, 'items') else item_data.copy()
                item_dict['ordem'] = ordem
                SolicitacaoRotaItem.objects.create(solicitacao=instance, **item_dict)
        
        return instance




from .models import Solicitacoes, SolicitacaoRotaItem
from servicos.models import Servico


class UserSerializer(serializers.ModelSerializer):
    """Serializer para o modelo User (solicitante)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']


class ServicoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Servico"""
    class Meta:
        model = Servico
        fields = ['id', 'nome']
        read_only_fields = ['id']


class SolicitacaoRotaItemSerializer(serializers.ModelSerializer):
    """Serializer para itens de uma solicitação Em Rota"""
    servico_nome = serializers.CharField(source='servico.nome', read_only=True, required=False)
    
    class Meta:
        model = SolicitacaoRotaItem
        fields = [
            'id', 'ticket_item', 'valor', 'servico', 'servico_nome',
            'ordem', 'recebedor', 'chave_pix', 'cliente_empresa', 'cnpj',
            'valor_km', 'valor_pedagio', 'valor_hospedagem', 
            'valor_fluvial', 'valor_outros'
        ]
        read_only_fields = ['id']
    
    def validate_servico(self, value):
        """Validação opcional para o serviço"""
        if value is None:
            return None
        return value


class SolicitacoesSerializer(serializers.ModelSerializer):
    """Serializer principal para o modelo Solicitacoes"""
    nome_solicitante = UserSerializer(read_only=True)
    nome_solicitante_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='nome_solicitante',
        write_only=True,
        required=False
    )
    servico_nome = serializers.CharField(source='servico.nome', read_only=True, required=False)
    itens_rota = SolicitacaoRotaItemSerializer(many=True, read_only=True)
    
    # Campos de URL para anexo
    anexo_url = serializers.SerializerMethodField()
    
    # Campos calculados
    valor_total_detalhados = serializers.SerializerMethodField()
    
    class Meta:
        model = Solicitacoes
        fields = [
            'id', 'ticket', 'status', 'titulo', 'nome_solicitante', 'nome_solicitante_id',
            'nome_do_recebedor', 'chave_pix', 'cliente_empresa', 'cnpj',
            'valor', 'descricao', 'data_de_pagamento', 'data_de_criacao',
            'anexo', 'anexo_url', 'tempo_criacao', 'tempo_fila',
            'data_entrada_status', 'data_aprovacao', 'prioridade',
            'servico', 'servico_nome', 'tipo',
            'valor_km', 'valor_pedagio', 'valor_hospedagem',
            'valor_fluvial', 'valor_outros', 'valor_receita',
            'valor_em_rota', 'descricao_em_rota',
            'itens_rota', 'valor_total_detalhados'
        ]
        read_only_fields = [
            'id', 'ticket', 'data_entrada_status', 'data_aprovacao',
            'valor_total_detalhados'
        ]
    
    def get_anexo_url(self, obj):
        """Retorna a URL completa do anexo se existir"""
        if obj.anexo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.anexo.url)
            return obj.anexo.url
        return None
    
    def get_valor_total_detalhados(self, obj):
        """Retorna o valor total dos detalhados"""
        return obj.get_valor_detalhados()
    
    def validate_titulo(self, value):
        """Validação do título"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("O título é obrigatório.")
        if len(value) > 70:
            raise serializers.ValidationError("O título não pode ter mais de 70 caracteres.")
        return value.strip()
    
    def validate_valor(self, value):
        """Validação do valor"""
        if value is None or value < 0:
            raise serializers.ValidationError("O valor deve ser maior ou igual a zero.")
        return value
    
    def validate_status(self, value):
        """Normaliza o status"""
        status_map = {
            'pendente': 'pendente',
            'aprovado': 'aprovado',
            'recusado': 'recusado',
            'concluido': 'concluido',
            'concluído': 'concluido',
        }
        return status_map.get(value.lower(), value.lower())
    
    def validate(self, attrs):
        """Validação geral do objeto"""
        # Se não foi fornecido nome_solicitante_id, usa o usuário autenticado
        if 'nome_solicitante' not in attrs and 'nome_solicitante_id' not in attrs:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                attrs['nome_solicitante'] = request.user
        
        # Validação para tipo Em Rota
        tipo = attrs.get('tipo', self.instance.tipo if self.instance else 'casual')
        if tipo == 'em_rota':
            # Para Em Rota, alguns campos podem ser opcionais
            pass
        else:
            # Para Casual, validar campos obrigatórios
            if not attrs.get('nome_do_recebedor'):
                raise serializers.ValidationError({
                    'nome_do_recebedor': 'O nome do recebedor é obrigatório para solicitações Casuais.'
                })
        
        return attrs


class SolicitacoesCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para criação e edição, incluindo criação de itens"""
    itens_rota = SolicitacaoRotaItemSerializer(many=True, required=False)
    nome_solicitante_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='nome_solicitante',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Solicitacoes
        fields = [
            'id', 'ticket', 'status', 'titulo', 'nome_solicitante_id',
            'nome_do_recebedor', 'chave_pix', 'cliente_empresa', 'cnpj',
            'valor', 'descricao', 'data_de_pagamento', 'data_de_criacao',
            'anexo', 'tempo_criacao', 'tempo_fila', 'prioridade',
            'servico', 'tipo',
            'valor_km', 'valor_pedagio', 'valor_hospedagem',
            'valor_fluvial', 'valor_outros', 'valor_receita',
            'valor_em_rota', 'descricao_em_rota',
            'itens_rota'
        ]
        read_only_fields = ['id', 'ticket']
    
    def validate(self, attrs):
        """Validação geral e lógica de criação"""
        # Se não foi fornecido nome_solicitante_id, usa o usuário autenticado
        if 'nome_solicitante' not in attrs:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                attrs['nome_solicitante'] = request.user
        
        # Validação para tipo Em Rota
        tipo = attrs.get('tipo', self.instance.tipo if self.instance else 'casual')
        if tipo == 'em_rota':
            # Validar que há itens se for Em Rota
            itens = attrs.get('itens_rota', [])
            if not itens and not self.instance:
                raise serializers.ValidationError({
                    'itens_rota': 'Solicitações Em Rota devem ter pelo menos um item.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Cria uma nova solicitação com seus itens"""
        itens_data = validated_data.pop('itens_rota', [])
        solicitacao = Solicitacoes.objects.create(**validated_data)
        
        # Criar itens da rota se houver
        for ordem, item_data in enumerate(itens_data, start=1):
            # Criar cópia do dict para não modificar o original
            item_dict = dict(item_data) if hasattr(item_data, 'items') else item_data.copy()
            item_dict['ordem'] = ordem
            SolicitacaoRotaItem.objects.create(solicitacao=solicitacao, **item_dict)
        
        return solicitacao
    
    def update(self, instance, validated_data):
        """Atualiza uma solicitação e seus itens"""
        itens_data = validated_data.pop('itens_rota', None)
        
        # Atualizar campos da solicitação
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Atualizar itens da rota se fornecidos
        if itens_data is not None:
            # Remover itens existentes
            instance.itens_rota.all().delete()
            # Criar novos itens
            for ordem, item_data in enumerate(itens_data, start=1):
                # Criar cópia do dict para não modificar o original
                item_dict = dict(item_data) if hasattr(item_data, 'items') else item_data.copy()
                item_dict['ordem'] = ordem
                SolicitacaoRotaItem.objects.create(solicitacao=instance, **item_dict)
        
        return instance

