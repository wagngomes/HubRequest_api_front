import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/centros.js'

export async function adminCentrosRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.listCentros)
  app.post('/', { preHandler: adminGuard }, ctrl.createCentro)
  app.post('/upload', { preHandler: adminGuard }, ctrl.uploadCentros)
  app.patch('/:id', { preHandler: adminGuard }, ctrl.updateCentro)
  app.delete('/:id', { preHandler: adminGuard }, ctrl.deleteCentro)
}
