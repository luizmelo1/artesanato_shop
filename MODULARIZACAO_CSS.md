# Modularização do CSS - Components

## Estrutura de Arquivos

O arquivo `components.css` foi dividido em módulos menores e mais organizados dentro da pasta `src/css/components/`. Esta estrutura facilita a manutenção, melhora a organização do código e permite trabalhar em componentes específicos sem afetar outros.

### Arquivos Criados

```
src/css/components/
├── buttons.css        - Botões (padrão, detalhes, comprar, scroll-to-top)
├── categories.css     - Filtros de categoria
├── loader.css         - Spinner de carregamento
├── modal.css          - Modal de detalhes do produto (com zoom)
├── product-card.css   - Cards de produto e grid
├── search.css         - Barra de busca
├── sections.css       - Seções (sobre, contato, títulos)
└── utilities.css      - Utilitários (prefers-reduced-motion)
```

### Como Funciona

O arquivo principal `components.css` agora importa todos os módulos usando `@import`:

```css
/* components.css */
@import 'components/buttons.css';
@import 'components/product-card.css';
@import 'components/modal.css';
@import 'components/loader.css';
@import 'components/categories.css';
@import 'components/search.css';
@import 'components/sections.css';
@import 'components/utilities.css';
```

### Vantagens

- **Manutenção mais fácil**: Cada componente tem seu próprio arquivo
- **Organização clara**: Fácil localizar estilos específicos
- **Desenvolvimento paralelo**: Múltiplos desenvolvedores podem trabalhar simultaneamente
- **Menor risco de conflitos**: Alterações isoladas em componentes específicos
- **Melhor performance no desenvolvimento**: Editores carregam arquivos menores

### Conteúdo de Cada Módulo

#### buttons.css
- `.btn` - Botão padrão
- `.btn-details` - Botão ver detalhes
- `.btn-buy` - Botão comprar
- `.scroll-to-top` - Botão voltar ao topo

#### product-card.css
- `.products-grid` - Grid de produtos
- `.product-card` - Card individual
- `.product-image` - Container de imagem
- `.product-info` - Informações do produto
- Animações fadeIn/fadeOut

#### modal.css
- `.modal` - Container do modal
- `.modal-body` - Corpo do modal
- `.modal-main-image` - Imagem com zoom
- `.modal-thumbs` - Miniaturas
- Responsividade mobile

#### loader.css
- `.products-loader` - Container do loader
- `.loader-spinner` - Animação de rotação
- Keyframes `@spin`

#### categories.css
- `.categories` - Container de categorias
- `.category` - Botão de categoria
- Estados hover e active
- Responsividade

#### search.css
- `.search-bar` - Container de busca
- Input de busca
- Ícone de busca
- Mensagem sem resultados

#### sections.css
- `.section-title` - Título de seção
- `.about` - Seção sobre
- `.contact` - Seção contato
- `.social-media-icon` - Ícones sociais

#### utilities.css
- `@media (prefers-reduced-motion)` - Reduz animações

### Backup

Um backup do arquivo original foi criado automaticamente:
- `components.css.backup-monolithic` - Arquivo original completo

### Compatibilidade

Esta estrutura mantém total compatibilidade com o código existente. Nenhuma mudança é necessária nos arquivos HTML ou JavaScript.
