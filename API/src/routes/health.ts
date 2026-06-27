import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'ok',
      })
    } catch {
      return reply.status(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'unreachable',
      })
    }
  })
}
