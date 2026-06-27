import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/constantes.js'

export async function adminConstantesRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.getConstantes)
  app.patch('/', { preHandler: adminGuard }, ctrl.updateConstantes)
}
