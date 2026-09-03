# MVSystem

Backend para gestão de pequenos comércios e operações de ponto de venda (PDV), desenvolvido com Node.js, TypeScript, Express, Prisma e PostgreSQL.

O sistema reúne autenticação e autorização, categorias, produtos, estoque fracionado, vendas transacionais, fluxo de caixa, relatórios gerenciais e auditoria de ações.

> O projeto está em desenvolvimento. Para produção, use HTTPS, segredos próprios, backups, monitoramento e um rate limiter compartilhado entre instâncias.

## Funcionalidades

- Cadastro público seguro com perfil padrão `caixa`.
- Login JWT e controle de acesso por perfis.
- Perfis `admin`, `gerente`, `caixa` e `estoque`.
- Cadastro e listagem de categorias.
- Cadastro, listagem e consulta de produtos por código de barras.
- Ajuste manual de estoque.
- Estoque e vendas fracionadas com precisão de milésimos.
- Valores monetários com precisão decimal de centavos.
- Venda atômica com preços consultados no banco e total calculado no backend.
- Idempotência de vendas contra duplicidade em reenvios.
- Abertura, movimentação, consulta e fechamento de caixa.
- Apenas um caixa aberto por vez.
- Bloqueio de vendas e movimentos em caixas fechados.
- Validação de saldo antes de saídas do caixa.
- Registro do valor contado no fechamento.
- Relatório diário e dashboard gerencial.
- Auditoria das principais ações administrativas e financeiras.
- Testes unitários e de integração com Jest e Supertest.

## Segurança e integridade

- O cadastro público não aceita `role`; novos usuários recebem o perfil `caixa`.
- JWT limitado a `HS256`, com emissor, audiência e expiração.
- Usuário e papel são confirmados no banco a cada requisição autenticada.
- Senhas entre 12 e 72 caracteres, protegidas com bcrypt.
- Rate limit global e limite mais restritivo para cadastro e login.
- CORS configurável por variável de ambiente.
- Headers defensivos via Helmet.
- Payload JSON limitado a 32 KB e schemas estritos com Zod.
- Erros internos sanitizados e registrados pelo logger.
- Transações serializáveis, locks e repetição de conflitos concorrentes.
- Enums, índices únicos e `CHECK constraints` no PostgreSQL.
- Credenciais de banco fora do arquivo Docker Compose.
- Dependências verificadas com `npm audit`.

O rate limiter atual utiliza memória local. Em uma implantação com múltiplas instâncias, configure um armazenamento compartilhado, como Redis. HTTPS deve ser terminado pela infraestrutura ou por um proxy reverso.

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

## Instalação

```bash
git clone https://github.com/YggorMartins/MVSystem.git
cd MVSystem
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

## Autenticação

Envie o token nas rotas protegidas:

```http
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

Cadastro público:

```json
{
  "email": "usuario@example.com",
  "password": "uma-senha-com-12-caracteres"
}
```

## Rotas

| Método | Rota | Perfis | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Cadastra usuário como `caixa` |
| `POST` | `/api/auth/login` | Público | Retorna um JWT |
| `POST` | `/api/categories` | Admin, gerente | Cadastra categoria |
| `GET` | `/api/categories` | Admin, gerente | Lista categorias |
| `POST` | `/api/products` | Admin, gerente, estoque | Cadastra produto |
| `GET` | `/api/products` | Todos autenticados | Lista produtos |
| `GET` | `/api/products/barcode/:barcode` | Todos autenticados | Busca por código de barras |
| `PATCH` | `/api/products/:id/stock` | Admin, estoque | Ajusta estoque |
| `POST` | `/api/sales` | Admin, gerente, caixa | Registra venda |
| `GET` | `/api/sales` | Admin, gerente, caixa | Lista vendas |
| `POST` | `/api/cash/open` | Admin, caixa | Abre caixa |
| `POST` | `/api/cash/close/:id` | Admin, caixa | Fecha caixa |
| `POST` | `/api/cash/movement` | Admin, caixa | Registra entrada ou saída |
| `GET` | `/api/cash/registers` | Admin, caixa | Lista caixas |
| `GET` | `/api/cash/registers/:id/movements` | Admin, caixa | Lista movimentos |
| `GET` | `/api/reports/daily` | Admin, gerente, caixa | Relatório diário |
| `GET` | `/api/reports/dashboard` | Admin, gerente, caixa | Dashboard gerencial |
| `GET` | `/api/audit/logs` | Admin, gerente | Lista auditoria |

## Exemplos

### Produto fracionado

```json
{
  "name": "Queijo por quilo",
  "barcode": "789000000001",
  "price": 42.90,
  "stockQuantity": 15.750,
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
      "quantity": 0.350
    }
  ]
}
```

Crie uma UUID para cada nova venda. Reutilize a chave somente ao repetir a mesma operação após timeout ou falha de rede. `unitPrice` e `totalAmount` não são recebidos do cliente.

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
  "initialAmount": 150.00
}
```

Movimento:

```json
{
  "cashRegisterId": 1,
  "type": "out",
  "amount": 25.50,
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
```

## Qualidade

```bash
npm run build
npm test
npx prisma validate
npm audit
```

As migrations são testadas em PostgreSQL 16 durante a validação de integração.

## Licença

Distribuído sob a licença ISC.
