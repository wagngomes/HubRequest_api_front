import type { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import * as ctrl from '../../controllers/admin/users.js'

export async function adminUsersRoutes(app: FastifyInstance) {
  const adminGuard = [authenticate, requireRole('ADMIN')]

  app.get('/', { preHandler: adminGuard }, ctrl.listUsers)
  app.post('/', { preHandler: adminGuard }, ctrl.createUser)
  app.patch('/:id', { preHandler: adminGuard }, ctrl.updateUser)
  app.delete('/:id', { preHandler: adminGuard }, ctrl.deleteUser)
}
