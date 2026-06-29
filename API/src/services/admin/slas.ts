import Papa from 'papaparse'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import { adminSlaSchema } from '../../lib/validations/admin.js'
import type { AdminSlaInput } from '../../lib/validations/admin.js'

interface SlaCSVRow {
  origem?: string
  siglaorigem?: string
  destino?: string
  sigladestino?: string
  sla?: string
  liberado?: string
  liberada?: string  // alias aceito pelo front
}

export async function listSlasAdminService() {
  return prisma.sla.findMany({ orderBy: { origem: 'asc' } })
}

export async function createSlaService(input: AdminSlaInput) {
  const existing = await prisma.sla.findFirst({
    where: { origem: input.origem, destino: input.destino },
  })
  if (existing) throw new HttpError(409, 'SLA para esta rota já existe')
  return prisma.sla.create({ data: input })
}

export async function updateSlaService(id: string, input: Partial<AdminSlaInput>) {
  const existing = await prisma.sla.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'SLA não encontrado')
  return prisma.sla.update({ where: { id }, data: input })
}

export async function deleteSlaService(id: string) {
  const existing = await prisma.sla.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'SLA não encontrado')
  await prisma.sla.delete({ where: { id } })
}

export async function uploadSlasCsvService(csvText: string) {
  const { data: rows, errors } = Papa.parse<SlaCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, ''),
  })

  if (errors.length > 0) throw new HttpError(422, 'Erro ao parsear CSV')

  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const origem = String(row.origem ?? '').trim()
    const destino = String(row.destino ?? '').trim()
    if (!origem || !destino) continue

    // sigla defaults to the CD code when column is absent
    const siglaOrigem = row.siglaorigem?.trim() || origem
    const siglaDestino = row.sigladestino?.trim() || destino
    // accept both "liberado" and "liberada" as column names
    const liberadoRaw = (row.liberado ?? row.liberada ?? 'S').trim().toUpperCase()

    const parsed = adminSlaSchema.safeParse({
      origem,
      siglaOrigem,
      destino,
      siglaDestino,
      sla: parseInt(row.sla ?? '0') || 0,
      liberado: liberadoRaw === 'S' ? 'S' : 'N',
    })

    if (!parsed.success) continue

    const existing = await prisma.sla.findFirst({ where: { origem, destino } })
    if (existing) {
      await prisma.sla.update({ where: { id: existing.id }, data: parsed.data })
      updated++
    } else {
      await prisma.sla.create({ data: parsed.data })
      inserted++
    }
  }

  return { message: 'Importação concluída', inserted, updated }
}
