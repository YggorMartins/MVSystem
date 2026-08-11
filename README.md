# MVSystem

MVSystem é uma aplicação backend para gestão de pequenos negócios, com foco em autenticação, cadastro de produtos, controle de estoque, vendas e fluxo de caixa. O projeto está sendo desenvolvido com Node.js, TypeScript, Express, Prisma e PostgreSQL.

## Status do projeto

⚠️ Este projeto ainda está em desenvolvimento e não é uma versão estável para produção.

### Etapa atual

Atualmente, o projeto está na fase de implementação da API principal do sistema, com os módulos básicos de:

- autenticação e autorização por perfil de usuário;
- cadastro e listagem de categorias;
- cadastro e consulta de produtos;
- ajuste manual de estoque;
- registro de vendas;
- estrutura inicial de persistência com Prisma e banco PostgreSQL.

### Próximos passos

As próximas etapas incluem:

- finalização do fluxo completo de caixa;
- implementação de relatórios e dashboards;
- refinamento de validações e regras de negócio;
- testes automatizados e melhorias de segurança;
- revisão da documentação e preparação para uma versão mais madura.

## Funcionalidades

### Implementadas até o momento

- Registro e login de usuários
- Controle de acesso por papéis: admin, gerente, caixa e estoque
- Cadastro de categorias
- Cadastro e listagem de produtos
- Ajuste de estoque
- Registro de vendas
- Persistência com Prisma

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
- PostgreSQL

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
DATABASE_URL="postgresql://usuario:senha@localhost:5432/mvsystem"
JWT_SECRET="seu-segredo-aqui"
```

4. Execute as migrações do Prisma:

```bash
npx prisma migrate dev
```

5. Opcionalmente, rode o seed inicial:

```bash
npm run prisma:seed
```

6. Inicie o servidor em modo de desenvolvimento:

```bash
npm run dev
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
- `POST /products`
- `GET /products`
- `PATCH /products/:id/stock`
- `POST /sales`

## Contribuição

Contribuições são bem-vindas. Como o projeto ainda está em fase inicial, sugestões, correções e melhorias são muito úteis.

## Licença

Este projeto é distribuído sob a licença ISC.
