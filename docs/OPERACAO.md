# Operação e implantação

## Produção

1. Copie `.env.production.example` para `.env.production` e substitua todos os segredos.
2. Termine HTTPS em um proxy reverso e encaminhe para `127.0.0.1:8080`.
3. Inicie com `docker compose --env-file .env.production -f compose.production.yaml up -d --build`.
4. Confirme `GET /health` e execute o roteiro de homologação.

Nunca publique a porta do PostgreSQL. Restrinja o acesso ao servidor, instale atualizações e monitore espaço em disco, disponibilidade e respostas HTTP 5xx.

## NFC-e e periféricos

`FISCAL_MODE=simulation` existe somente para desenvolvimento e homologação interna. Os documentos mostram **SEM VALIDADE FISCAL** e não são transmitidos à SEFAZ. Em produção, mantenha `FISCAL_MODE=disabled`; o processo recusa inicialização se uma simulação for habilitada com `NODE_ENV=production`.

Uma NFC-e real exige credenciamento estadual, CSC, certificado digital, dados tributários completos dos produtos e integração homologada para a UF. Ative isso somente após validação do contador e implementação de um provedor fiscal certificado. Nunca armazene certificado ou senha no Git.

O comprovante usa o diálogo nativo do navegador em largura de 80 mm. Configure a impressora no sistema operacional, margem zero e escala 100%. O leitor deve operar como teclado, enviar somente números e finalizar com Enter; testes simulam a cadência rápida do dispositivo sem instalar drivers privilegiados.

## Backup diário

Instale o cliente PostgreSQL e agende `npm run backup` com `DATABASE_URL` e `BACKUP_DIR` definidos. O script gera backup lógico em formato custom, mantém 30 dias e nunca inclui o diretório no Git.

Exemplo de cron às 02h: `0 2 * * * cd /opt/mvsystem && DATABASE_URL='...' BACKUP_DIR=/var/backups/mvsystem npm run backup`.

Copie os backups para outro equipamento ou armazenamento criptografado. Uma cópia apenas no mesmo servidor não protege contra perda do servidor.

## Teste de restauração

Use sempre um banco vazio e isolado. Confira duas vezes a URL e execute:

`CONFIRM_RESTORE=SIM DATABASE_URL='postgresql://.../mvsystem_restore_test' npm run restore -- backups/arquivo.dump`

Depois valide o login, contagens de produtos/vendas e relatórios. Registre a data do teste de restauração.

## Banco automatizado de testes

Suba `compose.test.yaml`, aplique as migrations e rode os testes somente com uma URL contendo `_test`. A proteção em `src/tests/setup.ts` interrompe a suíte caso alguém aponte para outro banco.
