import type { FastifyRequest, FastifyReply } from 'fastify'
import { loginSchema, registerSchema } from '../lib/validations/user.js'
import {
  loginService,
  getMeService,
  registerService,
  type LoginResult,
  type MeResult,
  type RegisterResult,
} from '../services/auth.js'

// ---------- Response types ----------
export type LoginResponse = LoginResult
export type MeResponse = { data: MeResult }
export type RegisterResponse = { data: RegisterResult }
export type LogoutResponse = { message: string }

// ---------- Handlers ----------
export async function login(request: FastifyRequest, reply: FastifyReply): Promise<LoginResponse> {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const result = await loginService(parsed.data)
  return reply.send(result)
}

export async function me(request: FastifyRequest, reply: FastifyReply): Promise<MeResponse> {
  const data = await getMeService(request.user.id)
  return reply.send({ data })
}

export async function logout(_request: FastifyRequest, reply: FastifyReply): Promise<LogoutResponse> {
  return reply.send({ message: 'Logout realizado' })
}

export async function register(request: FastifyRequest, reply: FastifyReply): Promise<RegisterResponse> {
  const parsed = registerSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await registerService(parsed.data)
  return reply.status(201).send({ data })
}
