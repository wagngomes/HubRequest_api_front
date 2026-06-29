import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminSlaSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/slas.js'

const idParam  = z.object({ id: z.string().min(1) })
const security = [{ bearerAuth: [] }]

export async function adminSlasRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Listar SLAs' },
  }, ctrl.listSlas)

  api.post('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Criar SLA', body: adminSlaSchema },
  }, ctrl.createSla)

  api.post('/upload', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Upload de SLAs via CSV' },
  }, ctrl.uploadSlas)

  api.patch('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar SLA', params: idParam, body: adminSlaSchema.partial() },
  }, ctrl.updateSla)

  api.delete('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Excluir SLA', params: idParam },
  }, ctrl.deleteSla)
}
