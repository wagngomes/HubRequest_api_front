import type { FastifyInstance } from 'fastify'
import { register } from '../lib/metrics.js'

export async function metricsRoutes(app: FastifyInstance) {
  app.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType)
    return reply.send(await register.metrics())
  })
}
