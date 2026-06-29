import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { registerRoutes } from './routes/index.js'

type TransportTarget = {
  target: string
  level: string
  options: Record<string, unknown>
}

function buildPinoTransport(): { targets: TransportTarget[] } | TransportTarget | undefined {
  const level = process.env.LOG_LEVEL ?? 'info'
  const isDev = process.env.NODE_ENV !== 'production'
  const hasLoki = !!process.env.LOKI_URL

  const targets: TransportTarget[] = []

  // Console — pino-pretty em dev, JSON puro em prod (sem transport)
  if (isDev) {
    targets.push({
      target: 'pino-pretty',
      level,
      options: { colorize: true, ignore: 'pid,hostname' },
    })
  }

  // Loki — envia logs para Grafana Cloud quando configurado
  if (hasLoki) {
    targets.push({
      target: 'pino-loki',
      level,
      options: {
        host: process.env.LOKI_URL as string,
        basicAuth: {
          username: process.env.LOKI_USER ?? '',
          password: process.env.LOKI_PASSWORD ?? '',
        },
        labels: {
          app: 'requesthub-api',
          env: process.env.NODE_ENV ?? 'development',
        },
        batching: true,
        interval: 5,
        silenceErrors: false,
      },
    })
  }

  if (targets.length === 0) return undefined
  return targets.length === 1 ? targets[0] : { targets }
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: buildPinoTransport(),
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
