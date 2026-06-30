# ════════════════════════════════════════════════════════════════════════════
#  Stage 1 — deps
#  Instala dependências isoladas do código-fonte para máximo aproveitamento
#  de cache quando apenas o src muda (e não o package.json).
# ════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ════════════════════════════════════════════════════════════════════════════
#  Stage 2 — builder
#  Build do Next.js com output standalone.
#  NEXT_PUBLIC_* são injetados em build time (baked no bundle JS do cliente).
# ════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Passa a URL da API como build arg (ex: --build-arg NEXT_PUBLIC_API_URL=...)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ════════════════════════════════════════════════════════════════════════════
#  Stage 3 — runner
#  Imagem final mínima usando apenas o output standalone do Next.js.
#  O standalone já contém um node_modules enxuto (só o necessário para SSR).
#  Resultado típico: ~200 MB vs ~1 GB com node_modules completo.
# ════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Servidor SSR autônomo gerado pelo Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Assets estáticos servidos pelo servidor embutido
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Arquivos públicos (favicons, robots.txt, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health > /dev/null || exit 1

CMD ["node", "server.js"]
