# ════════════════════════════════════════════════════════════════════════════
#  Stage 1 — builder
#  Instala todas as deps, gera o Prisma client, compila TypeScript e
#  remove devDependencies. node:20-slim (Debian) é necessário para os
#  binários do Prisma (libssl), que não funcionam corretamente com musl/Alpine.
# ════════════════════════════════════════════════════════════════════════════
FROM node:20-slim AS builder

WORKDIR /app

# libssl é necessário para o Prisma query engine em build e runtime
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copia manifestos primeiro — camada de deps é cacheada separadamente do src
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (dev + prod)
RUN npm ci --ignore-scripts

# Gera o Prisma Client para linux-openssl-3.0.x (Debian bookworm)
RUN npx prisma generate

# Copia o restante do código-fonte e compila TypeScript
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Prune de devDependencies — o diretório .prisma/client não é afetado
RUN npm prune --omit=dev

# ════════════════════════════════════════════════════════════════════════════
#  Stage 2 — runner
#  Imagem final mínima: dist/ + node_modules prunados + schema Prisma
# ════════════════════════════════════════════════════════════════════════════
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Usuário não-root para execução
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs apiuser

# Artefatos do builder
COPY --from=builder --chown=apiuser:nodejs /app/dist         ./dist
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/prisma       ./prisma
COPY --from=builder --chown=apiuser:nodejs /app/package.json ./package.json

# Entrypoint: aguarda DB + roda migrations antes de iniciar o servidor
COPY --chown=apiuser:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER apiuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "\
        fetch('http://localhost:3001/api/health')\
          .then(r => r.ok ? process.exit(0) : process.exit(1))\
          .catch(() => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
