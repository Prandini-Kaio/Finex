#!/usr/bin/env bash
set -euo pipefail

# Backup do PostgreSQL do Finex.
# Salva em ./backups/ com nome do banco e data/hora.
#
# Variáveis opcionais:
#   DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
#   BACKUP_DIR (padrão: pasta backups na raiz do projeto)
#   DOCKER_CONTAINER (padrão: finance-postgres)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
DB_NAME="${DB_NAME:-finance}"
DB_USER="${DB_USER:-finance}"
DB_PASSWORD="${DB_PASSWORD:-finance}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-finance-postgres}"

TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

run_pg_dump() {
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${DOCKER_CONTAINER}"; then
    echo "Usando container Docker: ${DOCKER_CONTAINER}"
    docker exec -e PGPASSWORD="${DB_PASSWORD}" "${DOCKER_CONTAINER}" \
      pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-acl
    return
  fi

  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "Erro: pg_dump não encontrado e o container ${DOCKER_CONTAINER} não está em execução."
    echo "Inicie o banco com: docker-compose up -d postgres"
    echo "Ou instale o cliente PostgreSQL (pacote postgresql-client)."
    exit 1
  fi

  echo "Usando pg_dump em ${DB_HOST}:${DB_PORT}"
  PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl
}

echo "Iniciando backup do banco '${DB_NAME}'..."

TMP_SQL="$(mktemp)"
TMP_ERR="$(mktemp)"
trap 'rm -f "${TMP_SQL}" "${TMP_ERR}"' EXIT

if run_pg_dump > "${TMP_SQL}" 2> "${TMP_ERR}"; then
  gzip -c "${TMP_SQL}" > "${BACKUP_FILE}"
  SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
  echo "Backup concluído: ${BACKUP_FILE} (${SIZE})"
else
  echo "Erro ao gerar backup:"
  cat "${TMP_ERR}"
  rm -f "${BACKUP_FILE}"
  exit 1
fi
