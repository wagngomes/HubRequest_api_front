import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminMarcaSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/marcas.js'

const idParam  = z.object({ id: z.string().min(1) })
const security = [{ bearerAuth: [] }]

const listQuery = z.object({
  search: z.string().default(''),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

export async function adminMarcasRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Listar marcas (paginado)', querystring: listQuery },
  }, ctrl.listMarcas)

  api.post('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Criar marca', body: adminMarcaSchema },
  }, ctrl.createMarca)

  api.post('/upload', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Upload de marcas via CSV' },
  }, ctrl.uploadMarcas)

  api.patch('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar marca', params: idParam, body: adminMarcaSchema.partial() },
  }, ctrl.updateMarca)

  api.delete('/:id', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Excluir marca', params: idParam },
  }, ctrl.deleteMarca)
}
