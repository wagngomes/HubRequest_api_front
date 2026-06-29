import { prisma } from './prisma.js'
import type { AuditAction, Setor } from '@prisma/client'

export interface AuditActor {
  id: string
  name: string
  email: string
  setor: Setor
}

export interface AuditPayload {
  actor: AuditActor
  action: AuditAction
  entity: string
  entityId: string
  changes?: Record<string, { from: unknown; to: unknown }>
  ip?: string
}

export function logAudit(payload: AuditPayload): void {
  prisma.auditLog
    .create({
      data: {
        userId:    payload.actor.id,
        userNome:  payload.actor.name,
        userEmail: payload.actor.email,
        userSetor: payload.actor.setor,
        action:    payload.action,
        entity:    payload.entity,
        entityId:  payload.entityId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        changes: payload.changes !== undefined ? JSON.parse(JSON.stringify(payload.changes)) : undefined,
        ip:      payload.ip ?? undefined,
      },
    })
    .catch((err) => console.error('[AuditLog] Failed to write:', err))
}

const SKIP_FIELDS = new Set(['createdAt', 'updatedAt', 'id'])

export function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      diff[key] = { from: oldObj[key], to: newObj[key] }
    }
  }
  return diff
}
