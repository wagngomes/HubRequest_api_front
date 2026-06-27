import type { FastifyRequest, FastifyReply } from 'fastify'
import { adminConstantesSchema } from '../../lib/validations/admin.js'
import { getConstantesAdminService, updateConstantesService } from '../../services/admin/constantes.js'

// ---------- Handlers ----------
export async function getConstantes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await getConstantesAdminService()
  return reply.send({ data })
}

export async function updateConstantes(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminConstantesSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await updateConstantesService(parsed.data)
  return reply.send({ data })
}
