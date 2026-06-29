import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../lib/auth/middleware.js'
import { loginSchema, registerSchema } from '../lib/validations/user.js'
import * as ctrl from '../controllers/auth.js'

const tokenResponse = z.object({
  token: z.string(),
  user: z.object({
    id:    z.string(),
    nome:  z.string(),
    email: z.string(),
    role:  z.string(),
    setor: z.string(),
  }),
})

const meResponse = z.object({
  data: z.object({
    id:        z.string(),
    nome:      z.string(),
    email:     z.string(),
    role:      z.string(),
    setor:     z.string(),
    createdAt: z.string(),
  }),
})

export async function authRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.post('/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: {
      tags: ['Auth'],
      summary: 'Login',
      description: 'Autentica o usuário e retorna um token JWT',
      body: loginSchema,
      response: { 200: tokenResponse },
    },
  }, ctrl.login)

  api.get('/auth/me', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Perfil do usuário autenticado',
      security: [{ bearerAuth: [] }],
      response: { 200: meResponse },
    },
  }, ctrl.me)

  api.post('/auth/logout', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout',
      security: [{ bearerAuth: [] }],
      response: { 200: z.object({ message: z.string() }) },
    },
  }, ctrl.logout)

  api.post('/auth/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Criar conta',
      body: registerSchema,
      response: { 201: meResponse },
    },
  }, ctrl.register)
}
