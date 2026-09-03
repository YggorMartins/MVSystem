# MVSystem Frontend

Interface React + TypeScript para o ponto de venda do MVSystem.

## Executar

```bash
cp .env.example .env
npm install
npm run dev
```

O frontend abre em `http://localhost:3000` e espera a API em
`http://localhost:4000/api`. Altere `VITE_API_URL` no `.env` quando necessário.

## Estrutura

- `components/layout`: navegação e estrutura comum das páginas.
- `components/pos`: busca, carrinho e pagamento do ponto de venda.
- `components/ui`: elementos visuais reutilizáveis.
- `contexts`: sessão e autenticação.
- `lib`: cliente HTTP e formatação.
- `pages`: telas e composição dos fluxos.
- `types`: contratos compartilhados da interface.

## Atalhos do caixa

- `F2`: focar a busca de produto.
- `F4`: abrir o recebimento.
- `Esc`: fechar o recebimento.
- `Enter`: buscar/adicionar o produto informado.
