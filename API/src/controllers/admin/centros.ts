import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminCentroInput } from '../../lib/validations/admin.js'
import { validateCsvFile } from '../../lib/file-validation.js'
import {
  listCentrosAdminService,
  createCentroService,
  updateCentroService,
  deleteCentroService,
  uploadCentrosCsvService,
} from '../../services/admin/centros.js'

export async function listCentros(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await listCentrosAdminService() })
}

export async function createCentro(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await createCentroService(request.body as AdminCentroInput) })
}

export async function updateCentro(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await updateCentroService(id, request.body as Partial<AdminCentroInput>) })
}

export async function deleteCentro(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteCentroService(id)
  return reply.send({ message: 'Centro excluído com sucesso' })
}

export async function uploadCentros(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  const fileError = validateCsvFile(file.filename, file.mimetype)
  if (fileError) return reply.status(400).send({ error: fileError })

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  return reply.send(await uploadCentrosCsvService(text))
}
