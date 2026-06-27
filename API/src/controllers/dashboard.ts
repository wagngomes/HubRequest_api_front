import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { getDashboardService } from '../services/dashboard.js'

// ---------- Input schemas ----------
const dashboardQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12).optional(),
  ano: z.coerce.number().int().min(2020).max(2100).optional(),
})

// ---------- Input types ----------
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>

// ---------- Handlers ----------
export async function getDashboard(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dashboardQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }

  const now = new Date()
  const mes = parsed.data.mes ?? now.getMonth() + 1
  const ano = parsed.data.ano ?? now.getFullYear()

  const data = await getDashboardService({ mes, ano })
  return reply.send(data)
}
