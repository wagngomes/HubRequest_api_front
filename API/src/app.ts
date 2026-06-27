import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { registerRoutes } from './routes/index.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      ...(process.env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty' },
      }),
    },
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(cors, {
    origin: process.env.FRONT_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.register(helmet)

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  })

  await registerRoutes(app)

  app.setErrorHandler((error, _request, reply) => {
    if (error.name === 'HttpError') {
      const httpError = error as unknown as { status: number; message: string }
      return reply.status(httpError.status).send({ error: httpError.message })
    }
    app.log.error(error)
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  })

  return app
}
