import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminSettingsInput } from '../../lib/validations/admin.js'
import { getSettingsService, updateSettingsService } from '../../services/admin/settings.js'

export async function getSettings(request: FastifyRequest, reply: FastifyReply) {
  const { key } = request.query as { key?: string }
  return reply.send({ data: await getSettingsService(key) })
}

export async function updateSettings(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await updateSettingsService(request.body as AdminSettingsInput) })
}
