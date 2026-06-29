import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminSlaInput } from '../../lib/validations/admin.js'
import { validateCsvFile } from '../../lib/file-validation.js'
import {
  listSlasAdminService,
  createSlaService,
  updateSlaService,
  deleteSlaService,
  uploadSlasCsvService,
} from '../../services/admin/slas.js'

export async function listSlas(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await listSlasAdminService() })
}

export async function createSla(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await createSlaService(request.body as AdminSlaInput) })
}

export async function updateSla(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await updateSlaService(id, request.body as Partial<AdminSlaInput>) })
}

export async function deleteSla(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteSlaService(id)
  return reply.send({ message: 'SLA excluído com sucesso' })
}

export async function uploadSlas(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  const fileError = validateCsvFile(file.filename, file.mimetype)
  if (fileError) return reply.status(400).send({ error: fileError })

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  return reply.send(await uploadSlasCsvService(text))
}
