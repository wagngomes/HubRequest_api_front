import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminConstantesSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/constantes.js'

const security = [{ bearerAuth: [] }]

export async function adminConstantesRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Buscar constantes do sistema' },
  }, ctrl.getConstantes)

  api.patch('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar constantes do sistema', body: adminConstantesSchema },
  }, ctrl.updateConstantes)
}
