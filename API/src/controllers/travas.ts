import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { travaSchema, travaMensagemSchema } from '../lib/validations/admin.js'
import { validateCsvFile } from '../lib/file-validation.js'
import { logAudit, diffObjects } from '../lib/audit.js'
import {
  listTravasService,
  listTravasByAreaService,
  getTravaService,
  createTravaService,
  updateTravaService,
  deleteTravaService,
  clearTravasService,
  uploadTravasCsvService,
} from '../services/travas.js'
import {
  listTravaMensagensService,
  createTravaMensagemService,
} from '../services/trava-msgs.js'

type TravaBody    = z.infer<typeof travaSchema>
type MensagemBody = z.infer<typeof travaMensagemSchema>

export async function listTravas(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listTravasService(request.query as Parameters<typeof listTravasService>[0]))
}

export async function listTravasByArea(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await listTravasByAreaService() })
}

export async function getTrava(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await getTravaService(id) })
}

export async function createTrava(request: FastifyRequest, reply: FastifyReply) {
  const data = await createTravaService(request.body as TravaBody)

  logAudit({
    actor: request.user,
    action: 'CREATE',
    entity: 'Trava',
    entityId: data.id,
    changes: { snapshot: { from: null, to: data } },
    ip: request.ip,
  })

  return reply.status(201).send({ data })
}

export async function updateTrava(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const oldTrava = await getTravaService(id)
  const updated  = await updateTravaService(id, request.body as Partial<TravaBody>)

  logAudit({
    actor: request.user,
    action: 'UPDATE',
    entity: 'Trava',
    entityId: updated.id,
    changes: diffObjects(
      oldTrava as unknown as Record<string, unknown>,
      updated  as unknown as Record<string, unknown>,
    ),
    ip: request.ip,
  })

  return reply.send({ data: updated })
}

export async function deleteTrava(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const existing = await getTravaService(id)
  await deleteTravaService(id)

  logAudit({
    actor: request.user,
    action: 'DELETE',
    entity: 'Trava',
    entityId: existing.id,
    changes: { snapshot: { from: existing, to: null } },
    ip: request.ip,
  })

  return reply.send({ message: 'Trava excluída com sucesso' })
}

export async function clearTravas(request: FastifyRequest, reply: FastifyReply) {
  const result = await clearTravasService()

  logAudit({
    actor: request.user,
    action: 'DELETE',
    entity: 'Trava',
    entityId: 'ALL',
    changes: { deleted: { from: result.deleted, to: 0 } },
    ip: request.ip,
  })

  return reply.send({ message: `${result.deleted} trava(s) excluída(s) com sucesso`, deleted: result.deleted })
}

export async function uploadTravas(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  const fileError = validateCsvFile(file.filename, file.mimetype)
  if (fileError) return reply.status(400).send({ error: fileError })

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  return reply.send(await uploadTravasCsvService(text))
}

export async function listMensagens(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await listTravaMensagensService(id) })
}

export async function createMensagem(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const body = request.body as MensagemBody
  const msg = await createTravaMensagemService(id, body, request.user)

  logAudit({
    actor: request.user,
    action: 'CREATE',
    entity: 'TravaMensagem',
    entityId: msg.id,
    changes: {
      travaId: { from: null, to: id },
      texto:   { from: null, to: body.texto },
    },
    ip: request.ip,
  })

  return reply.status(201).send({ data: msg })
}
