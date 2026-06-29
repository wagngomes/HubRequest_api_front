import type { FastifyRequest, FastifyReply } from 'fastify'
import { jwtVerify } from 'jose'
import { addToBlacklist } from '../lib/auth/token-blacklist.js'
import type { LoginInput, RegisterInput } from '../lib/validations/user.js'
import {
  loginService,
  getMeService,
  registerService,
  type LoginResult,
  type MeResult,
  type RegisterResult,
} from '../services/auth.js'

export type LoginResponse    = LoginResult
export type MeResponse       = { data: MeResult }
export type RegisterResponse = { data: RegisterResult }
export type LogoutResponse   = { message: string }

export async function login(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await loginService(request.body as LoginInput))
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await getMeService(request.user.id) })
}

export async function logout(request: FastifyRequest, reply: FastifyReply): Promise<LogoutResponse> {
  const token = request.headers.authorization!.slice(7)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-me-in-production-min-32-chars')
    const { payload } = await jwtVerify(token, secret)
    addToBlacklist(token, (payload.exp ?? 0) * 1000)
  } catch {
    // token já inválido — ignora
  }
  return reply.send({ message: 'Logout realizado' })
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await registerService(request.body as RegisterInput) })
}
