import { prisma } from '../../lib/prisma.js'
import type { AuditAction } from '@prisma/client'

export interface AuditListInput {
  page: number
  limit: number
  entity?: string
  userId?: string
  action?: AuditAction
  from?: Date
  to?: Date
}

export async function listAuditLogsService(input: AuditListInput) {
  const { page, limit, entity, userId, action, from, to } = input
  const skip = (page - 1) * limit

  const where = {
    ...(entity ? { entity } : {}),
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...((from ?? to)
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to   ? { lte: to   } : {}),
          },
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) }
}
