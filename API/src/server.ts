// Telemetria via dynamic import: o SDK deve ser iniciado ANTES de qualquer
// outro módulo (Fastify, http, Prisma) para que a auto-instrumentação funcione.
async function start() {
  const { default: sdk } = await import('./lib/telemetry.js')
  sdk.start()

  const { buildApp } = await import('./app.js')
  const app = await buildApp()

  // Graceful shutdown: fecha o Fastify (drena conexões ativas) e então o OTEL.
  // Os handlers são registrados DEPOIS de buildApp() para ter acesso a `app`.
  const shutdown = async (signal: string) => {
    app.log.info(`${signal} recebido — encerrando servidor`)
    try {
      await app.close()
    } finally {
      await sdk.shutdown().catch(() => {})
      process.exit(0)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  try {
    await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
