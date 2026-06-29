import type { FastifyRequest, FastifyReply } from 'fastify'
import { listAuditLogsService } from '../../services/admin/audit.js'

type ListQuery = {
  page: number
  limit: number
  entity?: string
  userId?: string
  action?: 'CREATE' | 'UPDATE' | 'DELETE'
  from?: string
  to?: string
}

export async function listAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  const { from, to, ...rest } = request.query as ListQuery
  return reply.send(
    await listAuditLogsService({
      ...rest,
      ...(from ? { from: new Date(from) } : {}),
      ...(to   ? { to:   new Date(to)   } : {}),
    }),
  )
}
