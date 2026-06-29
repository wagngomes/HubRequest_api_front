import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireSetor } from '../lib/auth/middleware.js'
import {
  solicitacaoLiberacaoSchema,
  liberacaoRetornoSchema,
  liberacaoItemStatusSchema,
} from '../lib/validations/liberacao.js'
import * as ctrl from '../controllers/liberacoes.js'

const idParam     = z.object({ id:     z.string().min(1) })
const itemIdParam = z.object({ itemId: z.string().min(1) })
const security    = [{ bearerAuth: [] }]

const listQuery = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().default(''),
  status: z.enum(['PENDENTE', 'PROCESSADA']).optional(),
})

export async function liberacoesRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.get('/', {
    preHandler: [authenticate],
    schema: { tags: ['Liberações'], security, summary: 'Listar liberações (paginado)', querystring: listQuery },
  }, ctrl.listLiberacoes)

  api.post('/', {
    preHandler: [authenticate],
    schema: { tags: ['Liberações'], security, summary: 'Criar solicitação de liberação', body: solicitacaoLiberacaoSchema },
  }, ctrl.createLiberacao)

  api.get('/item/:itemId', {
    preHandler: [authenticate],
    schema: { tags: ['Liberações'], security, summary: 'Buscar item de liberação', params: itemIdParam },
  }, ctrl.getLiberacaoItem)

  api.patch('/item/:itemId', {
    preHandler: [authenticate, requireSetor('PLANEJAMENTO')],
    schema: { tags: ['Liberações'], security, summary: 'Atualizar status de item (Planejamento)', params: itemIdParam, body: liberacaoItemStatusSchema },
  }, ctrl.updateLiberacaoItem)

  api.get('/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Liberações'], security, summary: 'Buscar solicitação por ID', params: idParam },
  }, ctrl.getLiberacao)

  api.patch('/:id', {
    preHandler: [authenticate, requireSetor('PLANEJAMENTO')],
    schema: { tags: ['Liberações'], security, summary: 'Aprovar ou reprovar solicitação (Planejamento)', params: idParam, body: liberacaoRetornoSchema },
  }, ctrl.updateLiberacao)

  api.delete('/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Liberações'], security, summary: 'Excluir solicitação', params: idParam },
  }, ctrl.deleteLiberacao)
}
