import type { FastifyInstance } from 'fastify'
import { authenticate, requireSetor } from '../lib/auth/middleware.js'
import * as ctrl from '../controllers/liberacoes.js'

export async function liberacoesRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, ctrl.listLiberacoes)
  app.post('/', { preHandler: [authenticate] }, ctrl.createLiberacao)
  app.get('/item/:itemId', { preHandler: [authenticate] }, ctrl.getLiberacaoItem)
  app.patch('/item/:itemId', { preHandler: [authenticate, requireSetor('PLANEJAMENTO')] }, ctrl.updateLiberacaoItem)
  app.get('/:id', { preHandler: [authenticate] }, ctrl.getLiberacao)
  app.patch('/:id', { preHandler: [authenticate, requireSetor('PLANEJAMENTO')] }, ctrl.updateLiberacao)
  app.delete('/:id', { preHandler: [authenticate] }, ctrl.deleteLiberacao)
}
