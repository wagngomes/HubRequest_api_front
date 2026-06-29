import type { FastifyInstance } from 'fastify'
import { authenticate, requireTravaEditor } from '../lib/auth/middleware.js'
import * as ctrl from '../controllers/travas.js'

export async function travasRoutes(app: FastifyInstance) {
  // Leitura — qualquer autenticado
  app.get('/',        { preHandler: [authenticate] }, ctrl.listTravas)
  app.get('/areas',   { preHandler: [authenticate] }, ctrl.listTravasByArea)
  app.get('/:id',     { preHandler: [authenticate] }, ctrl.getTrava)

  // Mensagens — qualquer autenticado pode ler e enviar
  app.get('/:id/mensagens',  { preHandler: [authenticate] }, ctrl.listMensagens)
  app.post('/:id/mensagens', { preHandler: [authenticate] }, ctrl.createMensagem)

  // Escrita — apenas travasEditores ou ADMIN
  app.post('/',         { preHandler: [authenticate, requireTravaEditor] }, ctrl.createTrava)
  app.post('/upload',   { preHandler: [authenticate, requireTravaEditor] }, ctrl.uploadTravas)
  app.patch('/:id',     { preHandler: [authenticate, requireTravaEditor] }, ctrl.updateTrava)
  app.delete('/:id',    { preHandler: [authenticate, requireTravaEditor] }, ctrl.deleteTrava)
}
