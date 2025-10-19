# Artesanato Shop - Estrutura refatorada

Organizei os arquivos do projeto em pastas para separação de responsabilidades:

- `index.html` - HTML principal
- `css/style.css` - estilos CSS extraídos
- `js/main.js` - lógica JavaScript extraída
- `db/products.json` - dados de produtos (JSON local)

Como testar localmente

1. Abra `index.html` no navegador. Para carregar `db/products.json` via `fetch`, em alguns navegadores (por exemplo Chrome) você pode precisar servir os arquivos via um servidor local em vez de abrir o arquivo diretamente.

Exemplo rápido com Python (no PowerShell):

```powershell
# a partir de c:\Users\felip\Desktop\github\artesanato_shop
python -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

Notas

- Os dados estão em `db/products.json`. Para persistência real (salvar novos produtos), será necessário um backend (API). Atualmente, o formulário admin apenas adiciona produtos em memória no JS.
- Se quiser, posso também configurar um pequeno servidor local em Node.js/Express para servir e persistir os produtos.
