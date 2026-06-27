import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminCentroSchema } from '../../lib/validations/admin.js'
import {
  listCentrosAdminService,
  createCentroService,
  updateCentroService,
  deleteCentroService,
} from '../../services/admin/centros.js'

// ---------- Input schemas ----------
const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

// ---------- Input types ----------
export type IdParam = z.infer<typeof idParamSchema>

// ---------- Handlers ----------
export async function listCentros(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listCentrosAdminService()
  return reply.send({ data })
}

export async function createCentro(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminCentroSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createCentroService(parsed.data)
  return reply.status(201).send({ data })
}

export async function updateCentro(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = adminCentroSchema.partial().safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateCentroService(idParsed.data.id, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteCentro(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteCentroService(parsed.data.id)
  return reply.send({ message: 'Centro excluído com sucesso' })
}
