import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  solicitacaoLiberacaoSchema,
  liberacaoRetornoSchema,
  liberacaoItemStatusSchema,
} from '../lib/validations/liberacao.js'
import {
  listLiberacoesService,
  createLiberacaoService,
  getLiberacaoService,
  updateLiberacaoService,
  deleteLiberacaoService,
  getLiberacaoItemService,
  updateLiberacaoItemService,
} from '../services/liberacoes.js'

// ---------- Input schemas ----------
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().default(''),
  status: z.enum(['PENDENTE', 'PROCESSADA']).optional(),
})

const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

const itemIdParamSchema = z.object({
  itemId: z.string().min(1, 'ID do item obrigatório'),
})

// ---------- Input types ----------
export type ListLiberacoesQuery = z.infer<typeof listQuerySchema>

// ---------- Handlers ----------
export async function listLiberacoes(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }
  return reply.send(await listLiberacoesService({ ...parsed.data, caller: request.user }))
}

export async function createLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const parsed = solicitacaoLiberacaoSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createLiberacaoService(parsed.data, request.user)
  return reply.status(201).send({ data })
}

export async function getLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  const data = await getLiberacaoService(parsed.data.id, request.user)
  return reply.send({ data })
}

export async function updateLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = liberacaoRetornoSchema.safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateLiberacaoService(idParsed.data.id, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteLiberacaoService(parsed.data.id, request.user)
  return reply.send({ message: 'Excluído com sucesso' })
}

export async function getLiberacaoItem(request: FastifyRequest, reply: FastifyReply) {
  const parsed = itemIdParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  const data = await getLiberacaoItemService(parsed.data.itemId, request.user)
  return reply.send({ data })
}

export async function updateLiberacaoItem(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = itemIdParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = liberacaoItemStatusSchema.safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateLiberacaoItemService(idParsed.data.itemId, bodyParsed.data)
  return reply.send({ data })
}
