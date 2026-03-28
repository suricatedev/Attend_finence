from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Segmento, PipelineEstagio, Lead, Oportunidade, Interacao, Tarefa


class SegmentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Segmento
        fields = ['id', 'nome', 'descricao', 'cor', 'ativo']
        read_only_fields = ['id']


class PipelineEstagioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineEstagio
        fields = ['id', 'nome', 'ordem', 'cor', 'ativo']
        read_only_fields = ['id']


class LeadSerializer(serializers.ModelSerializer):
    segmento_nome = serializers.CharField(source='segmento.nome', read_only=True, default='')
    responsavel_nome = serializers.CharField(source='responsavel.get_full_name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    origem_display = serializers.CharField(source='get_origem_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'nome', 'empresa', 'email', 'telefone', 'cnpj',
            'status', 'status_display', 'origem', 'origem_display',
            'segmento', 'segmento_nome', 'valor_estimado', 'observacoes',
            'responsavel', 'responsavel_nome', 'cliente_empresa',
            'data_criacao', 'data_atualizacao', 'criado_por'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao']

    def validate_valor_estimado(self, value):
        if value < 0:
            raise serializers.ValidationError("O valor estimado deve ser positivo.")
        return value


class OportunidadeSerializer(serializers.ModelSerializer):
    estagio_nome = serializers.CharField(source='estagio.nome', read_only=True, default='')
    responsavel_nome = serializers.CharField(source='responsavel.get_full_name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    valor_ponderado = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    lead_nome = serializers.CharField(source='lead.nome', read_only=True, default='')

    class Meta:
        model = Oportunidade
        fields = [
            'id', 'titulo', 'lead', 'lead_nome', 'cliente_empresa',
            'estagio', 'estagio_nome', 'status', 'status_display',
            'prioridade', 'valor_estimado', 'probabilidade',
            'data_fechamento_prevista', 'descricao',
            'responsavel', 'responsavel_nome', 'valor_ponderado',
            'data_criacao', 'data_atualizacao', 'criado_por'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'valor_ponderado']

    def validate_probabilidade(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Probabilidade deve estar entre 0 e 100.")
        return value

    def validate_valor_estimado(self, value):
        if value < 0:
            raise serializers.ValidationError("O valor estimado deve ser positivo.")
        return value


class InteracaoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True, default='')

    class Meta:
        model = Interacao
        fields = [
            'id', 'lead', 'oportunidade', 'cliente_empresa',
            'tipo', 'tipo_display', 'assunto', 'descricao',
            'data_interacao', 'duracao_minutos', 'usuario',
            'usuario_nome', 'data_criacao'
        ]
        read_only_fields = ['id', 'data_criacao']


class TarefaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    responsavel_nome = serializers.CharField(source='responsavel.get_full_name', read_only=True, default='')
    atrasada = serializers.BooleanField(read_only=True)

    class Meta:
        model = Tarefa
        fields = [
            'id', 'titulo', 'descricao', 'lead', 'oportunidade',
            'status', 'status_display', 'prioridade',
            'data_vencimento', 'responsavel', 'responsavel_nome',
            'atrasada', 'data_criacao', 'data_atualizacao', 'criado_por'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'atrasada']
