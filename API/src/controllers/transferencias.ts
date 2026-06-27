import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  solicitacaoTransferenciaSchema,
  transferenciaStatusSchema,
  transferenciaItemStatusSchema,
} from '../lib/validations/transferencia.js'
import {
  listTransferenciasService,
  createTransferenciaService,
  exportTransferenciasService,
  getTransferenciaService,
  updateTransferenciaService,
  deleteTransferenciaService,
  getTransferenciaItemService,
  updateTransferenciaItemService,
} from '../services/transferencias.js'

// ---------- Input schemas ----------
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().default(''),
  supridor: z.string().default(''),
  status: z.enum(['PENDENTE', 'PROCESSADA']).optional(),
})

const exportQuerySchema = z.object({
  search: z.string().default(''),
  supridor: z.string().default(''),
  status: z.enum(['PENDENTE', 'PROCESSADA']).optional(),
})

const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

const itemIdParamSchema = z.object({
  itemId: z.string().min(1, 'ID do item obrigatório'),
})

// ---------- Input types ----------
export type ListTransferenciasQuery = z.infer<typeof listQuerySchema>
export type ExportTransferenciasQuery = z.infer<typeof exportQuerySchema>

// ---------- Handlers ----------
export async function listTransferencias(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }
  return reply.send(await listTransferenciasService({ ...parsed.data, caller: request.user }))
}

export async function createTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const parsed = solicitacaoTransferenciaSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createTransferenciaService(parsed.data, request.user)
  return reply.status(201).send({ data })
}

export async function exportTransferencias(request: FastifyRequest, reply: FastifyReply) {
  const parsed = exportQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }
  const { buffer, filename } = await exportTransferenciasService(parsed.data)
  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(buffer)
}

export async function getTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  const data = await getTransferenciaService(parsed.data.id, request.user)
  return reply.send({ data })
}

export async function updateTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = transferenciaStatusSchema.safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateTransferenciaService(idParsed.data.id, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteTransferenciaService(parsed.data.id, request.user)
  return reply.send({ message: 'Excluído com sucesso' })
}

export async function getTransferenciaItem(request: FastifyRequest, reply: FastifyReply) {
  const parsed = itemIdParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  const data = await getTransferenciaItemService(parsed.data.itemId, request.user)
  return reply.send({ data })
}

export async function updateTransferenciaItem(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = itemIdParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = transferenciaItemStatusSchema.safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateTransferenciaItemService(idParsed.data.itemId, bodyParsed.data)
  return reply.send({ data })
}
