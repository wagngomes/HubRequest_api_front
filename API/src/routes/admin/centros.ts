import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminCentroSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/centros.js'

const idParam  = z.object({ id: z.string().min(1) })
const security = [{ bearerAuth: [] }]

export async function adminCentrosRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Listar centros' },
  }, ctrl.listCentros)

  api.post('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Criar centro', body: adminCentroSchema },
  }, ctrl.createCentro)

  api.post('/upload', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Upload de centros via CSV' },
  }, ctrl.uploadCentros)

  api.patch('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar centro', params: idParam, body: adminCentroSchema.partial() },
  }, ctrl.updateCentro)

  api.delete('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Excluir centro', params: idParam },
  }, ctrl.deleteCentro)
}
