import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminConstantesInput } from '../../lib/validations/admin.js'
import { getConstantesAdminService, updateConstantesService } from '../../services/admin/constantes.js'

export async function getConstantes(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await getConstantesAdminService() })
}

export async function updateConstantes(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await updateConstantesService(request.body as AdminConstantesInput) })
}
