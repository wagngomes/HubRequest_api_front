import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { travaSchema, travaMensagemSchema } from '../lib/validations/admin.js'
import {
  listTravasService,
  listTravasByAreaService,
  getTravaService,
  createTravaService,
  updateTravaService,
  deleteTravaService,
  uploadTravasCsvService,
} from '../services/travas.js'
import {
  listTravaMensagensService,
  createTravaMensagemService,
} from '../services/trava-msgs.js'

// ---------- Input schemas ----------
const listQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().default(''),
  area:   z.enum(['COMERCIAL', 'COMPRAS', 'PLANEJAMENTO', 'PRICING', 'FISCAL', 'OUTRAS']).optional(),
  status: z.enum(['ATIVA', 'INATIVA']).optional(),
})

const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

// ---------- Input types ----------
export type ListTravasQuery  = z.infer<typeof listQuerySchema>
export type IdParam          = z.infer<typeof idParamSchema>

// ---------- Handlers ----------
export async function listTravas(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listQuerySchema.safeParse(request.query)
  if (!parsed.success) return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  return reply.send(await listTravasService(parsed.data))
}

export async function listTravasByArea(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await listTravasByAreaService() })
}

export async function getTrava(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  return reply.send({ data: await getTravaService(parsed.data.id) })
}

export async function createTrava(request: FastifyRequest, reply: FastifyReply) {
  const parsed = travaSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  return reply.status(201).send({ data: await createTravaService(parsed.data) })
}

export async function updateTrava(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = travaSchema.partial().safeParse(request.body)
  if (!bodyParsed.success) return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })

  return reply.send({ data: await updateTravaService(idParsed.data.id, bodyParsed.data) })
}

export async function deleteTrava(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteTravaService(parsed.data.id)
  return reply.send({ message: 'Trava excluída com sucesso' })
}

export async function uploadTravas(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  if (!file.filename.endsWith('.csv')) return reply.status(400).send({ error: 'Formato inválido. Envie um .csv' })

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  return reply.send(await uploadTravasCsvService(text))
}

// ---------- Mensagens ----------
export async function listMensagens(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  return reply.send({ data: await listTravaMensagensService(parsed.data.id) })
}

export async function createMensagem(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = travaMensagemSchema.safeParse(request.body)
  if (!bodyParsed.success) return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })

  return reply.status(201).send({
    data: await createTravaMensagemService(idParsed.data.id, bodyParsed.data, request.user),
  })
}
