import type { FastifyInstance } from 'fastify'
import { authenticate } from '../lib/auth/middleware.js'
import * as ctrl from '../controllers/dashboard.js'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, ctrl.getDashboard)
}
