import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { adminProductSchema } from '../../lib/validations/admin.js'
import * as ctrl from '../../controllers/admin/products.js'

const codigoParam = z.object({ codigo: z.string().min(1) })
const security    = [{ bearerAuth: [] }]

const listQuery = z.object({
  search: z.string().default(''),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

export async function adminProductsRoutes(app: FastifyInstance) {
  const api        = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('ADMIN')]

  api.get('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Listar produtos (paginado)', querystring: listQuery },
  }, ctrl.listProducts)

  api.post('/', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Criar produto', body: adminProductSchema },
  }, ctrl.createProduct)

  api.post('/upload', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Upload de produtos via CSV' },
  }, ctrl.uploadProducts)

  api.post('/clear', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Remover todos os produtos' },
  }, ctrl.clearProducts)

  api.patch('/:codigo', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Atualizar produto', params: codigoParam, body: adminProductSchema.partial() },
  }, ctrl.updateProduct)

  api.delete('/:codigo', {
    preHandler: adminGuard,
    schema: { tags: ['Admin'], security, summary: 'Excluir produto', params: codigoParam },
  }, ctrl.deleteProduct)
}
