import type { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'
import { healthRoutes } from './health.js'
import { metricsRoutes } from './metrics.js'
import { authRoutes } from './auth.js'
import { transferenciasRoutes } from './transferencias.js'
import { liberacoesRoutes } from './liberacoes.js'
import { dadosMestresRoutes } from './dados-mestres.js'
import { dashboardRoutes } from './dashboard.js'
import { travasRoutes } from './travas.js'
import { adminRoutes } from './admin/index.js'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  // Infra — sem versão (load balancer, Prometheus)
  await app.register(healthRoutes, { prefix: '/api' })
  await app.register(metricsRoutes)

  // v1 — todas as rotas de negócio agrupadas num único escopo
  await app.register(async (v1) => {
    await v1.register(authRoutes)
    await v1.register(transferenciasRoutes, { prefix: '/transferencias' })
    await v1.register(liberacoesRoutes,      { prefix: '/liberacoes' })
    await v1.register(dadosMestresRoutes)
    await v1.register(dashboardRoutes,       { prefix: '/dashboard' })
    await v1.register(travasRoutes,          { prefix: '/travas' })
    await v1.register(adminRoutes,           { prefix: '/admin' })
  }, { prefix: '/api/v1' })
}
