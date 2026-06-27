import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signLocalToken } from '../lib/auth/jwt.js'
import { HttpError } from '../lib/errors.js'
import type { LoginInput, RegisterInput } from '../lib/validations/user.js'

export type LoginResult = {
  token: string
  user: {
    id: string
    email: string
    nome: string | null
    name: string | null
    role: string
    setor: string
  }
}

export type MeResult = {
  id: string
  nome: string | null
  name: string | null
  email: string
  role: string
  setor: string
  createdAt: Date
}

export type RegisterResult = {
  id: string
  nome: string | null
  email: string
  role: string
  setor: string
  createdAt: Date
}

export async function loginService(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || !user.passwordHash) throw new HttpError(401, 'E-mail ou senha incorretos')

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new HttpError(401, 'E-mail ou senha incorretos')

  const token = await signLocalToken({
    id: user.id,
    email: user.email,
    name: user.nome || user.name,
    role: user.role,
    setor: user.setor,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      nome: user.nome,
      name: user.name,
      role: user.role,
      setor: user.setor,
    },
  }
}

export async function getMeService(userId: string): Promise<MeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, name: true, email: true, role: true, setor: true, createdAt: true },
  })
  if (!user) throw new HttpError(404, 'Usuário não encontrado')
  return user
}

export async function registerService(input: RegisterInput): Promise<RegisterResult> {
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
      role: 'USER',
    },
    select: { id: true, nome: true, email: true, role: true, setor: true, createdAt: true },
  })
}
