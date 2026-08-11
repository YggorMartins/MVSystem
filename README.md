# MVSystem

MVSystem é uma aplicação backend para gestão de pequenos negócios, com foco em autenticação, cadastro de produtos, controle de estoque, vendas e fluxo de caixa. O projeto está sendo desenvolvido com Node.js, TypeScript, Express, Prisma e PostgreSQL.

## Status do projeto

⚠️ Este projeto ainda está em desenvolvimento e não é uma versão estável para produção.

### Etapa atual

Atualmente, o projeto está na fase de implementação da API principal do sistema e já conta com:

- autenticação e autorização por perfil de usuário;
- cadastro e listagem de categorias;
- cadastro e consulta de produtos;
- ajuste manual de estoque;
- registro e listagem de vendas;
- fluxo completo de caixa com abertura, movimentação e fechamento;
- relatórios diários e dashboard de gestão;
- auditoria de ações do sistema;
- suporte local a PostgreSQL via Docker Compose;
- testes automatizados com Jest e integração de segurança.

### Próximos passos

As próximas etapas incluem:

- finalização do fluxo completo de caixa;
- implementação de relatórios e dashboards mais completos;
- refinamento de validações e regras de negócio;
- ampliação da cobertura de testes e consolidação da suíte de integração;
- revisão da documentação e preparação para uma versão mais madura.

## Funcionalidades

### Implementadas até o momento

- Registro e login de usuários
- Controle de acesso por papéis: admin, gerente, caixa e estoque
- Cadastro de categorias
- Cadastro e listagem de produtos
- Ajuste de estoque
- Registro de vendas
- Fluxo completo de caixa: abertura, movimentação e fechamento
- Relatório diário de vendas
- Persistência com Prisma
- Suporte local a PostgreSQL via Docker Compose
- Testes automatizados com Jest

### Em desenvolvimento

- Fluxo completo de abertura/fechamento de caixa
- Movimentações financeiras
- Relatórios gerenciais
- Auditoria mais completa
- Integração com interface frontend

## Tecnologias

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT para autenticação
- Zod para validação de dados
- bcryptjs para criptografia de senhas

## Requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js 20 ou superior
- npm ou pnpm
- Docker (para rodar PostgreSQL via Docker Compose)
- PostgreSQL (ou usar o container Docker fornecido)

## Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd MVSystem
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente.

Crie um arquivo `.env` na raiz do projeto com o conteúdo abaixo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mvsystem"
JWT_SECRET="seu-segredo-aqui"
PORT=4000
```

4. Inicie o banco de dados PostgreSQL com Docker Compose:

```bash
docker compose up -d
```

5. Execute as migrações do Prisma:

```bash
npx prisma migrate dev
```

6. Opcionalmente, rode o seed inicial:

```bash
npm run prisma:seed
```

7. Inicie o servidor em modo de desenvolvimento:

```bash
npm run dev
```

8. Execute os testes:

```bash
npm test
```

## Estrutura do projeto

```text
src/
  controllers/      # Controladores das rotas
  services/         # Regras de negócio
  repositories/     # Acesso a dados
  schemas/          # Validações com Zod
  middleware/       # Autenticação e tratamento de erros
  routes.ts         # Definição das rotas da API
prisma/
  schema.prisma     # Modelo do banco de dados
  seed.ts           # Seed inicial
```

## Rotas principais

A API já conta com rotas para:

- `POST /auth/register`
- `POST /auth/login`
- `POST /categories`
- `GET /categories`
- `POST /products`
- `GET /products`
- `GET /products/barcode/:barcode`
- `PATCH /products/:id/stock`
- `POST /sales`
- `GET /sales`
- `POST /cash/open`
- `POST /cash/close/:id`
- `POST /cash/movement`
- `GET /cash/registers`
- `GET /cash/registers/:id/movements`
- `GET /reports/daily`
- `GET /reports/dashboard`
- `GET /audit/logs`

## Contribuição

Contribuições são bem-vindas. Como o projeto ainda está em fase inicial, sugestões, correções e melhorias são muito úteis.

## Licença

Este projeto é distribuído sob a licença ISC.
