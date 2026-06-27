import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import type { AdminUserCreateInput, AdminUserUpdateInput } from '../../lib/validations/admin.js'

export type AdminUserResult = {
  id: string
  nome: string | null
  name: string | null
  email: string
  setor: string
  role: string
  createdAt: Date
}

export async function listUsersService(): Promise<AdminUserResult[]> {
  return prisma.user.findMany({
    select: { id: true, nome: true, name: true, email: true, setor: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createUserService(input: AdminUserCreateInput): Promise<AdminUserResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new HttpError(409, 'E-mail já cadastrado')

  const passwordHash = await bcrypt.hash(input.password, 12)
  return prisma.user.create({
    data: {
      nome: input.nome,
      name: input.nome,
      email: input.email,
      passwordHash,
      setor: input.setor,
      role: input.role,
    },
    select: { id: true, nome: true, name: true, email: true, setor: true, role: true, createdAt: true },
  })
}

export async function updateUserService(id: string, input: AdminUserUpdateInput): Promise<AdminUserResult> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new HttpError(404, 'Usuário não encontrado')

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.nome ? { nome: input.nome, name: input.nome } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.setor ? { setor: input.setor } : {}),
      ...(input.role ? { role: input.role } : {}),
    },
    select: { id: true, nome: true, name: true, email: true, setor: true, role: true, createdAt: true },
  })
}

export async function deleteUserService(id: string, callerId: string): Promise<void> {
  if (id === callerId) throw new HttpError(400, 'Você não pode excluir sua própria conta')

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new HttpError(404, 'Usuário não encontrado')

  await prisma.user.delete({ where: { id } })
}
