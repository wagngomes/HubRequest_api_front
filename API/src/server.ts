// Telemetria via dynamic import: o SDK deve ser iniciado ANTES de qualquer
// outro módulo (Fastify, http, Prisma) para que a auto-instrumentação funcione.
async function start() {
  const { default: sdk } = await import('./lib/telemetry.js')
  sdk.start()

  process.on('SIGTERM', async () => { await sdk.shutdown().catch(() => {}); process.exit(0) })
  process.on('SIGINT',  async () => { await sdk.shutdown().catch(() => {}); process.exit(0) })

  const { buildApp } = await import('./app.js')
  const app = await buildApp()

  try {
    await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
