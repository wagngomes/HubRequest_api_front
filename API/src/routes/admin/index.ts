import type { FastifyInstance } from 'fastify'
import { adminUsersRoutes } from './users.js'
import { adminMarcasRoutes } from './marcas.js'
import { adminProductsRoutes } from './products.js'
import { adminSlasRoutes } from './slas.js'
import { adminRestricoesRoutes } from './restricoes.js'
import { adminCentrosRoutes } from './centros.js'
import { adminConstantesRoutes } from './constantes.js'
import { adminSettingsRoutes } from './settings.js'

export async function adminRoutes(app: FastifyInstance) {
  await app.register(adminUsersRoutes, { prefix: '/users' })
  await app.register(adminMarcasRoutes, { prefix: '/marcas' })
  await app.register(adminProductsRoutes, { prefix: '/products' })
  await app.register(adminSlasRoutes, { prefix: '/slas' })
  await app.register(adminRestricoesRoutes, { prefix: '/restricoes' })
  await app.register(adminCentrosRoutes, { prefix: '/centros' })
  await app.register(adminConstantesRoutes, { prefix: '/constantes' })
  await app.register(adminSettingsRoutes, { prefix: '/settings' })
}
