import type { FastifyInstance } from 'fastify'
import { authenticate } from '../lib/auth/middleware.js'
import * as ctrl from '../controllers/dados-mestres.js'

export async function dadosMestresRoutes(app: FastifyInstance) {
  app.get('/centros', { preHandler: [authenticate] }, ctrl.listCentros)
  app.get('/slas', { preHandler: [authenticate] }, ctrl.listSlas)
  app.get('/restricoes', { preHandler: [authenticate] }, ctrl.listRestricoes)
  app.get('/constantes', { preHandler: [authenticate] }, ctrl.getConstantes)
  app.get('/produtos/:codigo', { preHandler: [authenticate] }, ctrl.getProdutoByCodigo)
}
