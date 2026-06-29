import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminRestricaoSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/restricoes.js'

const idParam  = z.object({ id: z.string().min(1) })
const security = [{ bearerAuth: [] }]

export async function adminRestricoesRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Listar restrições' },
  }, ctrl.listRestricoes)

  api.post('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Criar restrição', body: adminRestricaoSchema },
  }, ctrl.createRestricao)

  api.delete('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Excluir restrição', params: idParam },
  }, ctrl.deleteRestricao)
}
