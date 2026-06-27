import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminUserCreateSchema, adminUserUpdateSchema } from '../../lib/validations/admin.js'
import {
  listUsersService,
  createUserService,
  updateUserService,
  deleteUserService,
} from '../../services/admin/users.js'

// ---------- Input schemas ----------
const idParamSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
})

// ---------- Input types ----------
export type IdParam = z.infer<typeof idParamSchema>

// ---------- Handlers ----------
export async function listUsers(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listUsersService()
  return reply.send({ data })
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminUserCreateSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createUserService(parsed.data)
  return reply.status(201).send({ data })
}

export async function updateUser(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = idParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'ID inválido' })

  const bodyParsed = adminUserUpdateSchema.safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateUserService(idParsed.data.id, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'ID inválido' })
  await deleteUserService(parsed.data.id, request.user.id)
  return reply.send({ message: 'Usuário excluído com sucesso' })
}
