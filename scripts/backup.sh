#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?Defina DATABASE_URL}"
backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
file="$backup_dir/mvsystem-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$file"
find "$backup_dir" -type f -name 'mvsystem-*.dump' -mtime +30 -delete
echo "Backup criado: $file"
