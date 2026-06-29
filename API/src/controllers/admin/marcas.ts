import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminMarcaInput } from '../../lib/validations/admin.js'
import { validateCsvFile } from '../../lib/file-validation.js'
import {
  listMarcasService,
  createMarcaService,
  updateMarcaService,
  deleteMarcaService,
  uploadMarcasCsvService,
} from '../../services/admin/marcas.js'

export async function listMarcas(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listMarcasService(request.query as { search: string; page: number; limit: number }))
}

export async function createMarca(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await createMarcaService(request.body as AdminMarcaInput) })
}

export async function updateMarca(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await updateMarcaService(id, request.body as Partial<AdminMarcaInput>) })
}

export async function deleteMarca(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteMarcaService(id)
  return reply.send({ message: 'Marca excluída com sucesso' })
}

export async function uploadMarcas(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  const fileError = validateCsvFile(file.filename, file.mimetype)
  if (fileError) return reply.status(400).send({ error: fileError })

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  return reply.send(await uploadMarcasCsvService(text))
}
