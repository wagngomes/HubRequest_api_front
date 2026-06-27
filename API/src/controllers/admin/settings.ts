import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminSettingsSchema } from '../../lib/validations/admin.js'
import { getSettingsService, updateSettingsService } from '../../services/admin/settings.js'

// ---------- Input schemas ----------
const getQuerySchema = z.object({
  key: z.string().optional(),
})

// ---------- Input types ----------
export type GetSettingsQuery = z.infer<typeof getQuerySchema>

// ---------- Handlers ----------
export async function getSettings(request: FastifyRequest, reply: FastifyReply) {
  const parsed = getQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }
  const data = await getSettingsService(parsed.data.key)
  return reply.send({ data })
}

export async function updateSettings(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminSettingsSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await updateSettingsService(parsed.data)
  return reply.send({ data })
}
