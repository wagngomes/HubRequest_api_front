import type { FastifyInstance } from 'fastify'
import { authenticate, requireSetor } from '../lib/auth/middleware.js'
import * as ctrl from '../controllers/transferencias.js'

export async function transferenciasRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, ctrl.listTransferencias)
  app.post('/', { preHandler: [authenticate] }, ctrl.createTransferencia)
  app.get('/export', { preHandler: [authenticate, requireSetor('PLANEJAMENTO')] }, ctrl.exportTransferencias)
  app.get('/item/:itemId', { preHandler: [authenticate] }, ctrl.getTransferenciaItem)
  app.patch('/item/:itemId', { preHandler: [authenticate, requireSetor('PLANEJAMENTO')] }, ctrl.updateTransferenciaItem)
  app.get('/:id', { preHandler: [authenticate] }, ctrl.getTransferencia)
  app.patch('/:id', { preHandler: [authenticate, requireSetor('PLANEJAMENTO')] }, ctrl.updateTransferencia)
  app.delete('/:id', { preHandler: [authenticate] }, ctrl.deleteTransferencia)
}
