import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminUserCreateSchema, adminUserUpdateSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/users.js'

const idParam  = z.object({ id: z.string().min(1) })
const security = [{ bearerAuth: [] }]

export async function adminUsersRoutes(app: FastifyInstance) {
  const api       = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Listar usuários' },
  }, ctrl.listUsers)

  api.post('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Criar usuário', body: adminUserCreateSchema },
  }, ctrl.createUser)

  api.patch('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar usuário', params: idParam, body: adminUserUpdateSchema },
  }, ctrl.updateUser)

  api.delete('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Excluir usuário', params: idParam },
  }, ctrl.deleteUser)
}
