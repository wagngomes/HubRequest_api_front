#!/bin/sh
set -e

echo "[entrypoint] Aguardando banco de dados..."

# Tenta conectar até 30s antes de desistir
MAX_RETRIES=15
RETRY=0
until node -e "
  const { PrismaClient } = require('./node_modules/@prisma/client/index.js');
  const p = new PrismaClient();
  p.\$connect().then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] ERRO: banco não respondeu após ${MAX_RETRIES} tentativas. Abortando."
    exit 1
  fi
  echo "[entrypoint] Tentativa ${RETRY}/${MAX_RETRIES} — aguardando 2s..."
  sleep 2
done

echo "[entrypoint] Banco disponível. Executando migrations..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Migrations concluídas. Iniciando servidor..."
exec node --max-old-space-size=512 dist/server.js
