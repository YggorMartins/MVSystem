#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?Defina DATABASE_URL}"
: "${1:?Uso: scripts/restore.sh caminho-do-backup.dump}"
if [ "${CONFIRM_RESTORE:-}" != "SIM" ]; then
  echo "Restauração cancelada. Execute com CONFIRM_RESTORE=SIM após conferir o banco de destino."
  exit 2
fi
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" "$1"
echo "Backup restaurado com sucesso."
