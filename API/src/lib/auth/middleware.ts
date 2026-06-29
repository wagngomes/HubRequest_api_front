import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Role, Setor } from '@prisma/client'
import { verifyLocalToken, verifyOidcToken } from './jwt.js'
import { mapClaims, type IdPClaims } from './claims-mapper.js'
import { prisma } from '../prisma.js'

export interface RequestUser {
  id: string
  email: string
  name: string
  role: Role
  setor: Setor
}

declare module 'fastify' {
  interface FastifyRequest {
    user: RequestUser
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token não informado' })
    return
  }

  const token = authHeader.slice(7)
  const authMode = process.env.AUTH_MODE ?? 'local'

  try {
    if (authMode === 'oidc') {
      const rawClaims = await verifyOidcToken(token)
      request.user = mapClaims(rawClaims as IdPClaims)
    } else {
      request.user = await verifyLocalToken(token)
    }
  } catch {
    reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!roles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Acesso negado' })
    }
  }
}

export function requireSetor(...setores: Setor[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!setores.includes(request.user.setor)) {
      reply.status(403).send({ error: 'Setor sem permissão' })
    }
  }
}

export async function requireTravaEditor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.user.role === 'ADMIN') return
  const config = await prisma.appConfig.findUnique({ where: { key: 'travasEditores' } })
  const editores = (config?.value ?? '').split(';').map((e) => e.trim().toLowerCase()).filter(Boolean)
  if (!editores.includes(request.user.email.toLowerCase())) {
    reply.status(403).send({ error: 'Sem permissão para editar travas' })
  }
}
