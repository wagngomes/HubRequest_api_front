import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminSlaSchema } from '../../lib/validations/admin.js'
import {
  listSlasAdminService,
  createSlaService,
  updateSlaService,
  deleteSlaService,
  uploadSlasCsvService,
} from '../../services/admin/slas.js'

// ---------- Input schemas ----------
const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

// ---------- Input types ----------
export type IdParam = z.infer<typeof idParamSchema>

// ---------- Handlers ----------
export async function listSlas(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listSlasAdminService()
  return reply.send({ data })
}

export async function createSla(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminSlaSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createSlaService(parsed.data)
  return reply.status(201).send({ data })
}

export async function updateSla(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = adminSlaSchema.partial().safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateSlaService(idParsed.data.id, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteSla(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteSlaService(parsed.data.id)
  return reply.send({ message: 'SLA excluído com sucesso' })
}

export async function uploadSlas(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  if (!file.filename.endsWith('.csv')) {
    return reply.status(400).send({ error: 'Formato inválido. Envie um .csv' })
  }

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  const result = await uploadSlasCsvService(text)
  return reply.send(result)
}
