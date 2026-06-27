import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminMarcaSchema } from '../../lib/validations/admin.js'
import {
  listMarcasService,
  createMarcaService,
  updateMarcaService,
  deleteMarcaService,
  uploadMarcasCsvService,
} from '../../services/admin/marcas.js'

// ---------- Input schemas ----------
const listQuerySchema = z.object({
  search: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

// ---------- Input types ----------
export type ListMarcasQuery = z.infer<typeof listQuerySchema>
export type IdParam = z.infer<typeof idParamSchema>

// ---------- Handlers ----------
export async function listMarcas(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }
  return reply.send(await listMarcasService(parsed.data))
}

export async function createMarca(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminMarcaSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createMarcaService(parsed.data)
  return reply.status(201).send({ data })
}

export async function updateMarca(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = adminMarcaSchema.partial().safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateMarcaService(idParsed.data.id, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteMarca(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteMarcaService(parsed.data.id)
  return reply.send({ message: 'Marca excluída com sucesso' })
}

export async function uploadMarcas(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  if (!file.filename.endsWith('.csv')) {
    return reply.status(400).send({ error: 'Formato inválido. Envie um arquivo .csv' })
  }

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  const result = await uploadMarcasCsvService(text)
  return reply.send(result)
}
