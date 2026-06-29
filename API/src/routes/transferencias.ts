import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireSetor } from '../lib/auth/middleware.js'
import {
  solicitacaoTransferenciaSchema,
  transferenciaStatusSchema,
  transferenciaItemStatusSchema,
} from '../lib/validations/transferencia.js'
import * as ctrl from '../controllers/transferencias.js'

const idParam     = z.object({ id:     z.string().min(1) })
const itemIdParam = z.object({ itemId: z.string().min(1) })
const security    = [{ bearerAuth: [] }]

const listQuery = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(10),
  search:   z.string().default(''),
  supridor: z.string().default(''),
  status:   z.enum(['PENDENTE', 'PROCESSADA']).optional(),
})

const exportQuery = z.object({
  search:   z.string().default(''),
  supridor: z.string().default(''),
  status:   z.enum(['PENDENTE', 'PROCESSADA']).optional(),
})

export async function transferenciasRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.get('/', {
    preHandler: [authenticate],
    schema: { tags: ['Transferências'], security, summary: 'Listar transferências (paginado)', querystring: listQuery },
  }, ctrl.listTransferencias)

  api.post('/', {
    preHandler: [authenticate],
    schema: { tags: ['Transferências'], security, summary: 'Criar solicitação de transferência', body: solicitacaoTransferenciaSchema },
  }, ctrl.createTransferencia)

  api.get('/export', {
    preHandler: [authenticate, requireSetor('PLANEJAMENTO')],
    schema: { tags: ['Transferências'], security, summary: 'Exportar transferências para XLSX', querystring: exportQuery },
  }, ctrl.exportTransferencias)

  api.get('/item/:itemId', {
    preHandler: [authenticate],
    schema: { tags: ['Transferências'], security, summary: 'Buscar item de transferência', params: itemIdParam },
  }, ctrl.getTransferenciaItem)

  api.patch('/item/:itemId', {
    preHandler: [authenticate, requireSetor('PLANEJAMENTO')],
    schema: { tags: ['Transferências'], security, summary: 'Atualizar status de item (Planejamento)', params: itemIdParam, body: transferenciaItemStatusSchema },
  }, ctrl.updateTransferenciaItem)

  api.get('/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Transferências'], security, summary: 'Buscar solicitação por ID', params: idParam },
  }, ctrl.getTransferencia)

  api.patch('/:id', {
    preHandler: [authenticate, requireSetor('PLANEJAMENTO')],
    schema: { tags: ['Transferências'], security, summary: 'Processar solicitação (Planejamento)', params: idParam, body: transferenciaStatusSchema },
  }, ctrl.updateTransferencia)

  api.delete('/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Transferências'], security, summary: 'Excluir solicitação', params: idParam },
  }, ctrl.deleteTransferencia)
}
