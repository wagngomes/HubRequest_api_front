import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/products.js'

export async function adminProductsRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.listProducts)
  app.post('/', { preHandler: adminGuard }, ctrl.createProduct)
  app.post('/upload', { preHandler: adminGuard }, ctrl.uploadProducts)
  app.post('/clear', { preHandler: adminGuard }, ctrl.clearProducts)
  app.patch('/:codigo', { preHandler: adminGuard }, ctrl.updateProduct)
  app.delete('/:codigo', { preHandler: adminGuard }, ctrl.deleteProduct)
}
