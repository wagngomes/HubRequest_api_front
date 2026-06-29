import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireRole } from '../../lib/auth/middleware.js'
import { listAuditLogs } from '../../controllers/admin/audit.js'

const security = [{ bearerAuth: [] }]

const listQuery = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  entity: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  from:   z.string().datetime({ offset: true }).optional(),
  to:     z.string().datetime({ offset: true }).optional(),
})

export async function adminAuditRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.get('/', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: { tags: ['Admin'], security, summary: 'Trilha de auditoria (paginado)', querystring: listQuery },
  }, listAuditLogs)
}
