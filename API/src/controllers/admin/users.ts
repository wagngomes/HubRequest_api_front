import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminUserCreateInput, AdminUserUpdateInput } from '../../lib/validations/admin.js'
import {
  listUsersService,
  createUserService,
  updateUserService,
  deleteUserService,
} from '../../services/admin/users.js'

export async function listUsers(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await listUsersService() })
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await createUserService(request.body as AdminUserCreateInput) })
}

export async function updateUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await updateUserService(id, request.body as AdminUserUpdateInput) })
}

export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteUserService(id, request.user.id)
  return reply.send({ message: 'Usuário excluído com sucesso' })
}
