import { prisma } from '../../lib/prisma.js'
import type { AdminSettingsInput } from '../../lib/validations/admin.js'

const KNOWN_KEYS = [
  'notificationEmails',
  'notificationEmailsTransferencia',
  'notificationEmailsLiberacao',
  'travasEditores',
] as const

type KnownKey = (typeof KNOWN_KEYS)[number]

export async function getSettingsService(key?: string) {
  if (key && KNOWN_KEYS.includes(key as KnownKey)) {
    const config = await prisma.appConfig.findUnique({ where: { key } })
    return { [key]: config?.value ?? '' }
  }

  const configs = await prisma.appConfig.findMany({ where: { key: { in: [...KNOWN_KEYS] } } })
  return Object.fromEntries(KNOWN_KEYS.map((k) => [k, configs.find((c) => c.key === k)?.value ?? '']))
}

export async function updateSettingsService(input: AdminSettingsInput) {
  const updates: Record<string, string> = {}
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) {
      updates[k] = v
        .split(';')
        .map((e) => e.trim())
        .filter((e) => e.length > 0)
        .join(';')
    }
  }

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.appConfig.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  )

  return updates
}
