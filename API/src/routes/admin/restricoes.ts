import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/restricoes.js'

export async function adminRestricoesRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.listRestricoes)
  app.post('/', { preHandler: adminGuard }, ctrl.createRestricao)
  app.delete('/:id', { preHandler: adminGuard }, ctrl.deleteRestricao)
}
