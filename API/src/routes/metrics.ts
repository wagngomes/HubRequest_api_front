import type { FastifyInstance } from 'fastify'
import { register } from '../lib/metrics.js'
import { authenticate, requireRole } from '../lib/auth/middleware.js'

export async function metricsRoutes(app: FastifyInstance) {
  app.get('/metrics', {
    preHandler: [authenticate, requireRole('ADMIN')],
  }, async (_request, reply) => {
    reply.header('Content-Type', register.contentType)
    return reply.send(await register.metrics())
  })
}
