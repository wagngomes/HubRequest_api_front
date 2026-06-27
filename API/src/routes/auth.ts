import type { FastifyInstance } from 'fastify'
import { authenticate } from '../lib/auth/middleware.js'
import * as ctrl from '../controllers/auth.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', ctrl.login)
  app.get('/auth/me', { preHandler: [authenticate] }, ctrl.me)
  app.post('/auth/logout', { preHandler: [authenticate] }, ctrl.logout)
  app.post('/auth/register', ctrl.register)
}
