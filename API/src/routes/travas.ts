import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate, requireTravaEditor } from '../lib/auth/middleware.js'
import { travaSchema, travaMensagemSchema } from '../lib/validations/admin.js'
import * as ctrl from '../controllers/travas.js'

const idParam   = z.object({ id: z.string().min(1) })
const areaEnum  = z.enum(['COMERCIAL', 'COMPRAS', 'PLANEJAMENTO', 'PRICING', 'FISCAL', 'OUTRAS'])
const statusEnum = z.enum(['ATIVA', 'INATIVA'])

const listQuery = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().default(''),
  area:   areaEnum.optional(),
  status: statusEnum.optional(),
})

const security = [{ bearerAuth: [] }]

export async function travasRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  // ── Leitura ──────────────────────────────────────────────────────
  api.get('/', {
    preHandler: [authenticate],
    schema: {
      tags: ['Travas'], security, summary: 'Listar travas (paginado)',
      querystring: listQuery,
    },
  }, ctrl.listTravas)

  api.get('/areas', {
    preHandler: [authenticate],
    schema: { tags: ['Travas'], security, summary: 'Contagem de travas por área' },
  }, ctrl.listTravasByArea)

  api.get('/:id', {
    preHandler: [authenticate],
    schema: {
      tags: ['Travas'], security, summary: 'Buscar trava por ID',
      params: idParam,
    },
  }, ctrl.getTrava)

  // ── Mensagens ─────────────────────────────────────────────────────
  api.get('/:id/mensagens', {
    preHandler: [authenticate],
    schema: {
      tags: ['Travas'], security, summary: 'Listar mensagens de uma trava',
      params: idParam,
    },
  }, ctrl.listMensagens)

  api.post('/:id/mensagens', {
    preHandler: [authenticate],
    schema: {
      tags: ['Travas'], security, summary: 'Enviar mensagem em uma trava',
      params: idParam,
      body: travaMensagemSchema,
    },
  }, ctrl.createMensagem)

  // ── Escrita (travasEditores ou ADMIN) ─────────────────────────────
  api.post('/', {
    preHandler: [authenticate, requireTravaEditor],
    schema: {
      tags: ['Travas'], security, summary: 'Criar trava',
      body: travaSchema,
    },
  }, ctrl.createTrava)

  api.patch('/:id', {
    preHandler: [authenticate, requireTravaEditor],
    schema: {
      tags: ['Travas'], security, summary: 'Atualizar trava',
      params: idParam,
      body: travaSchema.partial(),
    },
  }, ctrl.updateTrava)

  api.delete('/:id', {
    preHandler: [authenticate, requireTravaEditor],
    schema: {
      tags: ['Travas'], security, summary: 'Excluir trava',
      params: idParam,
    },
  }, ctrl.deleteTrava)

  api.post('/upload', {
    preHandler: [authenticate, requireTravaEditor],
    schema: {
      tags: ['Travas'], security, summary: 'Importar travas via CSV',
      consumes: ['multipart/form-data'],
    },
  }, ctrl.uploadTravas)

  api.delete('/clear', {
    preHandler: [authenticate, requireTravaEditor],
    schema: { tags: ['Travas'], security, summary: 'Excluir todas as travas' },
  }, ctrl.clearTravas)
}
