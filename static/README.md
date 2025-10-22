# Sistema de Gestão de Campanhas de Marketing

Um sistema moderno e responsivo para gerenciamento de campanhas de marketing, desenvolvido com HTML, CSS e JavaScript puro.

## 🚀 Funcionalidades

### ✨ Interface Moderna
- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Sidebar Colapsível**: Navegação intuitiva com menu lateral
- **Kanban Board**: Visualização clara das campanhas em diferentes estágios
- **Tema Moderno**: Interface limpa e profissional

### 🎯 Gestão de Campanhas
- **Criação de Campanhas**: Formulário completo para novas campanhas
- **Drag & Drop**: Mova cards entre colunas facilmente
- **Prioridades**: Sistema de prioridades (Alta, Média, Baixa)
- **Atribuição**: Designar responsáveis e emails
- **Controle de Tempo**: Acompanhamento de tempo gasto

### 📊 Colunas do Kanban
1. **Planejamento**: Campanhas em fase de planejamento
2. **Teste**: Campanhas em fase de teste
3. **Lançamento**: Campanhas ativas sendo executadas
4. **Análise**: Análise de campanhas finalizadas
5. **Bem Sucedidas**: Campanhas finalizadas com sucesso

### 🛠️ Funcionalidades Avançadas
- **Busca**: Pesquise campanhas por título, responsável ou email
- **Filtros**: Filtre por prioridade
- **Exportação**: Exporte dados em JSON
- **Importação**: Importe dados de arquivos JSON
- **Notificações**: Sistema de notificações em tempo real
- **Atalhos de Teclado**: Ctrl+N para nova campanha, ESC para fechar modais

## 🎨 Características do Design

### Cores e Estilo
- **Paleta Principal**: Azul (#3498db), Cinza escuro (#2c3e50)
- **Gradientes**: Efeitos visuais modernos
- **Sombras**: Profundidade e elevação
- **Animações**: Transições suaves e responsivas

### Responsividade
- **Mobile First**: Otimizado para dispositivos móveis
- **Breakpoints**: Adaptação em diferentes tamanhos de tela
- **Touch Friendly**: Interface otimizada para toque

## 🚀 Como Usar

### Instalação
1. Baixe os arquivos do projeto
2. Abra o `index.html` em qualquer navegador moderno
3. Não requer servidor ou instalação adicional

### Funcionalidades Básicas
1. **Criar Campanha**: Clique no botão "+ Criar nova campanha"
2. **Mover Cards**: Arraste e solte cards entre colunas
3. **Editar Card**: Clique duplo em um card para editá-lo
4. **Navegar**: Use a sidebar para acessar diferentes seções

### Atalhos de Teclado
- `Ctrl + N`: Criar nova campanha
- `ESC`: Fechar modais
- `Tab`: Navegar entre elementos

## 🔧 Estrutura do Projeto

```
sistema-financeiro-attend/
├── index.html          # Estrutura principal
├── styles.css          # Estilos e responsividade
├── script.js           # Funcionalidades JavaScript
└── README.md           # Documentação
```

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Dispositivos
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎯 Funcionalidades Técnicas

### JavaScript
- **Classes ES6**: Código organizado e modular
- **Event Listeners**: Interatividade responsiva
- **Local Storage**: Persistência de dados
- **Drag & Drop API**: Funcionalidade nativa do navegador

### CSS
- **Flexbox**: Layout moderno e flexível
- **Grid**: Organização eficiente
- **Media Queries**: Responsividade completa
- **Animations**: Transições suaves

### HTML5
- **Semântica**: Estrutura clara e acessível
- **Acessibilidade**: Suporte a leitores de tela
- **SEO Friendly**: Meta tags otimizadas

## 🔒 Segurança

- **Validação de Formulários**: Prevenção de dados inválidos
- **Sanitização**: Limpeza de inputs do usuário
- **XSS Protection**: Prevenção de ataques de script

## 🚀 Performance

- **Lazy Loading**: Carregamento otimizado
- **Minificação**: Código otimizado
- **Caching**: Estratégias de cache eficientes
- **Compressão**: Recursos comprimidos

## 🛠️ Desenvolvimento

### Estrutura do Código
```javascript
class CampaignManager {
    constructor() {
        this.cards = [];
        this.currentCardId = 1;
        this.init();
    }
    
    // Métodos principais
    init() { }
    setupEventListeners() { }
    createCampaign() { }
    moveCard() { }
}
```

### Padrões Utilizados
- **MVC**: Separação de responsabilidades
- **Observer**: Sistema de notificações
- **Factory**: Criação de elementos dinâmicos
- **Singleton**: Gerenciamento de estado

## 📈 Próximas Funcionalidades

- [ ] Sistema de usuários e autenticação
- [ ] Relatórios avançados com gráficos
- [ ] Integração com APIs externas
- [ ] Sistema de notificações push
- [ ] Modo offline com sincronização
- [ ] Temas personalizáveis
- [ ] Integração com calendário
- [ ] Sistema de comentários nos cards

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Teste thoroughly
5. Submeta um pull request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Entre em contato via email
- Consulte a documentação

---

**Desenvolvido com ❤️ para facilitar a gestão de campanhas de marketing**
