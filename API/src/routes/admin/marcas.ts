import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/marcas.js'

export async function adminMarcasRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.listMarcas)
  app.post('/', { preHandler: adminGuard }, ctrl.createMarca)
  app.post('/upload', { preHandler: adminGuard }, ctrl.uploadMarcas)
  app.patch('/:id', { preHandler: adminGuard }, ctrl.updateMarca)
  app.delete('/:id', { preHandler: adminGuard }, ctrl.deleteMarca)
}
