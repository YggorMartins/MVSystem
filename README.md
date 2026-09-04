# MVSystem

Sistema completo para gestão de pequenos comércios e operações de ponto de venda (PDV), com frontend React e API Node.js, TypeScript, Express, Prisma e PostgreSQL.

O sistema reúne autenticação e autorização, catálogo e estoque analítico, vendas transacionais, fluxo de caixa, clientes e fiado, relatórios gerenciais e auditoria de ações.

> O projeto está em desenvolvimento. Para produção, use HTTPS, segredos próprios, backups, monitoramento e um rate limiter compartilhado entre instâncias.

## Funcionalidades

- Gestão administrativa de usuários, perfis, senhas e bloqueio de acesso.
- Login JWT e controle de acesso por perfis.
- Perfis `admin`, `gerente`, `caixa` e `estoque`.
- Cadastro e listagem de categorias.
- Cadastro, listagem e consulta de produtos por código de barras.
- Edição completa e arquivamento seguro de produtos.
- Preço de custo, preço de venda, unidade de medida e limite de estoque baixo.
- Ajuste manual de estoque.
- Estoque e vendas fracionadas com precisão de milésimos.
- Valores monetários com precisão decimal de centavos.
- Venda atômica com preços consultados no banco e total calculado no backend.
- Idempotência de vendas contra duplicidade em reenvios.
- Cancelamento administrativo com devolução automática dos itens ao estoque.
- Abertura, movimentação, consulta e fechamento de caixa.
- Apenas um caixa aberto por vez.
- Bloqueio de vendas e movimentos em caixas fechados.
- Validação de saldo antes de saídas do caixa.
- Registro do valor contado no fechamento.
- Cadastro e busca de clientes para vendas no fiado.
- Pagamentos parciais ou quitação total do saldo consolidado do cliente.
- Relatório diário, dashboard gerencial e relatório analítico de estoque por categoria.
- Impressão e exportação do relatório de estoque para PDF pelo navegador.
- Interface responsiva com atalhos de teclado e identidade visual do Mercadinho da Vizinha.
- Auditoria das principais ações administrativas e financeiras.
- Fornecedores e compras com entrada transacional e estorno seguro de estoque.
- Comprovante não fiscal otimizado para impressora térmica de 80 mm.
- Leitura de código de barras por campo focado ou captura rápida do scanner.
- NFC-e em simulador explicitamente sem validade fiscal e bloqueado em produção.
- Testes unitários e de integração com Jest e Supertest.

## Segurança e integridade

- Não há cadastro público; somente administradores criam e gerenciam funcionários.
- JWT limitado a `HS256`, com emissor, audiência e expiração.
- Usuário e papel são confirmados no banco a cada requisição autenticada.
- Senhas entre 12 e 72 caracteres, protegidas com bcrypt.
- Rate limit específico para cadastro e login, sem limitar as rotas operacionais autenticadas.
- CORS configurável por variável de ambiente.
- Headers defensivos via Helmet.
- Payload JSON limitado a 32 KB e schemas estritos com Zod.
- Erros internos sanitizados e registrados pelo logger.
- Transações serializáveis, locks e repetição de conflitos concorrentes.
- Enums, índices únicos e `CHECK constraints` no PostgreSQL.
- Credenciais de banco fora do arquivo Docker Compose.
- Dependências verificadas com `npm audit`.

O rate limiter de autenticação utiliza memória local. Em uma implantação com múltiplas instâncias, configure um armazenamento compartilhado, como Redis. HTTPS deve ser terminado pela infraestrutura ou por um proxy reverso.

## Tecnologias

- Node.js 20+
- TypeScript
- Express 5
- Prisma ORM
- PostgreSQL 16
- Zod
- JSON Web Token
- bcryptjs
- Helmet e CORS
- Winston
- Jest e Supertest
- Docker Compose
- React 19
- Vite
- React Router
- Lucide React
- Prettier

## Instalação

```bash
git clone https://github.com/YggorMartins/MVSystem.git
cd MVSystem
npm install
cp .env.example .env
cd frontend
npm install
cp .env.example .env
```

Configure o `.env` com valores próprios:

```env
PORT=4000
DATABASE_URL="postgresql://mvsystem:SENHA_FORTE@localhost:5432/mvsystem"
JWT_SECRET="SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES"
CORS_ORIGINS="http://localhost:3000"

POSTGRES_USER=mvsystem
POSTGRES_PASSWORD=SENHA_FORTE
POSTGRES_DB=mvsystem

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="SENHA_DE_ADMIN_COM_12_OU_MAIS_CARACTERES"
```

Separe múltiplas origens CORS por vírgula. Nunca reutilize os valores ilustrativos em produção nem versione o `.env`.

## Banco de dados

Inicie o PostgreSQL e aplique as migrations:

```bash
docker compose up -d
npx prisma migrate deploy
```

Crie ou atualize o administrador inicial usando as variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD`:

```bash
npm run prisma:seed
```

O seed não possui senha padrão e não abre um caixa automaticamente.

## Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

A API utiliza `http://localhost:4000` por padrão. As rotas de negócio ficam sob `/api`.

Em outro terminal, execute o frontend:

```bash
cd frontend
npm run dev
```

A interface abre em `http://localhost:3000`.

## Produção, backup e homologação

- Consulte [docs/OPERACAO.md](docs/OPERACAO.md) para implantação com containers, HTTPS, health check, backup e restauração.
- Execute e registre [docs/HOMOLOGACAO.md](docs/HOMOLOGACAO.md) antes de liberar a versão no comércio.
- Os testes exigem `NODE_ENV=test` e um banco isolado cujo nome contenha `_test`.

## Autenticação

Envie o token nas rotas protegidas:

```http
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

Funcionários são cadastrados no módulo **Usuários**, disponível apenas para administradores.

## Rotas

| Método   | Rota                                 | Perfis                  | Descrição                        |
| -------- | ------------------------------------ | ----------------------- | -------------------------------- |
| `POST`   | `/api/auth/login`                    | Público                 | Retorna um JWT                   |
| `GET`    | `/api/users`                         | Admin                   | Lista funcionários               |
| `POST`   | `/api/users`                         | Admin                   | Cadastra funcionário             |
| `PATCH`  | `/api/users/:id`                     | Admin                   | Edita ou bloqueia funcionário    |
| `POST`   | `/api/categories`                    | Admin, gerente          | Cadastra categoria               |
| `GET`    | `/api/categories`                    | Admin, gerente          | Lista categorias                 |
| `POST`   | `/api/products`                      | Admin, gerente, estoque | Cadastra produto                 |
| `GET`    | `/api/products`                      | Todos autenticados      | Lista produtos                   |
| `GET`    | `/api/products/barcode/:barcode`     | Todos autenticados      | Busca por código de barras       |
| `PATCH`  | `/api/products/:id`                  | Admin, gerente, estoque | Atualiza produto completo        |
| `DELETE` | `/api/products/:id`                  | Admin                   | Arquiva produto                  |
| `PATCH`  | `/api/products/:id/stock`            | Admin, estoque          | Ajusta estoque                   |
| `POST`   | `/api/sales`                         | Admin, gerente, caixa   | Registra venda                   |
| `GET`    | `/api/sales`                         | Admin, gerente, caixa   | Lista vendas                     |
| `DELETE` | `/api/sales/:id`                     | Admin                   | Cancela venda e repõe estoque    |
| `GET`    | `/api/customers`                     | Admin, gerente, caixa   | Lista clientes                   |
| `POST`   | `/api/customers`                     | Admin, gerente, caixa   | Cadastra cliente                 |
| `GET`    | `/api/credits`                       | Admin, gerente, caixa   | Lista vendas fiadas              |
| `POST`   | `/api/customers/:id/credit-payments` | Admin, gerente, caixa   | Registra pagamento do fiado      |
| `POST`   | `/api/cash/open`                     | Admin, caixa            | Abre caixa                       |
| `POST`   | `/api/cash/close/:id`                | Admin, caixa            | Fecha caixa                      |
| `POST`   | `/api/cash/movement`                 | Admin, caixa            | Registra entrada ou saída        |
| `GET`    | `/api/cash/registers`                | Admin, caixa            | Lista caixas                     |
| `GET`    | `/api/cash/registers/:id/movements`  | Admin, caixa            | Lista movimentos                 |
| `GET`    | `/api/reports/daily`                 | Admin, gerente, caixa   | Relatório diário                 |
| `GET`    | `/api/reports/dashboard`             | Admin, gerente, caixa   | Dashboard gerencial              |
| `GET`    | `/api/reports/inventory`             | Admin, gerente, estoque | Relatório analítico de estoque   |
| `GET`    | `/api/audit/logs`                    | Admin, gerente          | Lista auditoria                  |
| `GET`    | `/api/suppliers`                     | Admin, gerente, estoque | Lista fornecedores               |
| `POST`   | `/api/suppliers`                     | Admin, gerente, estoque | Cadastra fornecedor              |
| `PATCH`  | `/api/suppliers/:id`                 | Admin, gerente, estoque | Atualiza fornecedor              |
| `GET`    | `/api/purchases`                     | Admin, gerente, estoque | Lista compras                    |
| `POST`   | `/api/purchases`                     | Admin, gerente, estoque | Recebe compra e atualiza estoque |
| `DELETE` | `/api/purchases/:id`                 | Admin, gerente          | Estorna compra com proteção      |
| `POST`   | `/api/sales/:id/nfce/simulate`       | Admin, gerente          | Gera NFC-e simulada              |

## Exemplos

### Produto fracionado

```json
{
  "name": "Queijo por quilo",
  "barcode": "789000000001",
  "costPrice": 31.5,
  "price": 42.9,
  "stockQuantity": 15.75,
  "unit": "KG",
  "lowStockThreshold": 2.5,
  "categoryId": 1
}
```

### Venda

```json
{
  "idempotencyKey": "123e4567-e89b-42d3-a456-426614174000",
  "paymentMethod": "pix",
  "cashRegisterId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 0.35
    }
  ]
}
```

Crie uma UUID para cada nova venda. Reutilize a chave somente ao repetir a mesma operação após timeout ou falha de rede. `unitPrice` e `totalAmount` não são recebidos do cliente.

Para uma venda no fiado, envie também `customerId`. Os pagamentos posteriores são registrados no saldo consolidado do cliente e distribuídos automaticamente pelas dívidas mais antigas.

Formas de pagamento:

- `dinheiro`
- `cartao_credito`
- `cartao_debito`
- `pix`
- `fiado`

### Caixa

Abertura:

```json
{
  "initialAmount": 150.0
}
```

Movimento:

```json
{
  "cashRegisterId": 1,
  "type": "out",
  "amount": 25.5,
  "description": "Pagamento de fornecedor"
}
```

Fechamento:

```json
{
  "closingAmount": 987.65
}
```

O movimento aceita `in` para entrada e `out` para saída.

## Estrutura

```text
src/
  controllers/       # Camada HTTP
  lib/               # Ambiente, JWT, logger e Prisma
  middleware/        # Autenticação, autorização, erros e validação
  repositories/      # Acesso a dados
  schemas/           # Contratos Zod
  services/          # Regras de negócio e transações
  tests/             # Testes unitários e de integração
  routes.ts           # Rotas e permissões
prisma/
  migrations/         # Histórico do banco
  schema.prisma       # Modelo de dados
  seed.ts             # Criação segura do administrador
frontend/
  src/components/     # Layout, PDV, produtos e componentes reutilizáveis
  src/contexts/       # Sessão e autenticação
  src/pages/          # Dashboard, PDV, caixa, fiado, produtos e relatórios
  src/lib/            # Cliente HTTP e formatação
```

## Qualidade

```bash
npm run build
npx prisma validate
npm audit
npm run format:check
cd frontend && npm run build && npm test
```

Para a suíte de integração, suba `compose.test.yaml`, aplique as migrations e execute `npm test` com `NODE_ENV=test`, um `JWT_SECRET` de testes e uma `DATABASE_URL` cujo banco contenha `_test`. Veja o procedimento completo em [docs/OPERACAO.md](docs/OPERACAO.md). Essa proteção impede que a suíte apague dados de desenvolvimento ou produção.

## Licença

Distribuído sob a licença ISC.
