import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminRestricaoInput } from '../../lib/validations/admin.js'
import {
  listRestricoesAdminService,
  createRestricaoService,
  deleteRestricaoService,
} from '../../services/admin/restricoes.js'

export async function listRestricoes(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await listRestricoesAdminService() })
}

export async function createRestricao(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await createRestricaoService(request.body as AdminRestricaoInput) })
}

export async function deleteRestricao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteRestricaoService(id)
  return reply.send({ message: 'Restrição excluída com sucesso' })
}
