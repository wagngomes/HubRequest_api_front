import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/slas.js'

export async function adminSlasRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.listSlas)
  app.post('/', { preHandler: adminGuard }, ctrl.createSla)
  app.post('/upload', { preHandler: adminGuard }, ctrl.uploadSlas)
  app.patch('/:id', { preHandler: adminGuard }, ctrl.updateSla)
  app.delete('/:id', { preHandler: adminGuard }, ctrl.deleteSla)
}
