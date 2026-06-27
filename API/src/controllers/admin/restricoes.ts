import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminRestricaoSchema } from '../../lib/validations/admin.js'
import {
  listRestricoesAdminService,
  createRestricaoService,
  deleteRestricaoService,
} from '../../services/admin/restricoes.js'

// ---------- Input schemas ----------
const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

// ---------- Input types ----------
export type IdParam = z.infer<typeof idParamSchema>

// ---------- Handlers ----------
export async function listRestricoes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listRestricoesAdminService()
  return reply.send({ data })
}

export async function createRestricao(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminRestricaoSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createRestricaoService(parsed.data)
  return reply.status(201).send({ data })
}

export async function deleteRestricao(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteRestricaoService(parsed.data.id)
  return reply.send({ message: 'Restrição excluída com sucesso' })
}
