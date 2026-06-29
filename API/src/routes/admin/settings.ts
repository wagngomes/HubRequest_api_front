import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminSettingsSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/settings.js'

const security = [{ bearerAuth: [] }]

const getQuery = z.object({
  key: z.string().optional(),
})

export async function adminSettingsRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Buscar configurações', querystring: getQuery },
  }, ctrl.getSettings)

  api.patch('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar configurações', body: adminSettingsSchema },
  }, ctrl.updateSettings)
}
