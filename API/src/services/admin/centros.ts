import Papa from 'papaparse'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import { adminCentroSchema } from '../../lib/validations/admin.js'
import type { AdminCentroInput } from '../../lib/validations/admin.js'

interface CentroCSVRow {
  codigo?: string
  label?: string
  nome?: string  // alias aceito
}

export async function listCentrosAdminService() {
  return prisma.centroDistribuicao.findMany({ orderBy: { codigo: 'asc' } })
}

export async function createCentroService(input: AdminCentroInput) {
  const existing = await prisma.centroDistribuicao.findUnique({ where: { codigo: input.codigo } })
  if (existing) throw new HttpError(409, 'Centro com este código já existe')
  return prisma.centroDistribuicao.create({ data: input })
}

export async function updateCentroService(id: string, input: Partial<AdminCentroInput>) {
  const existing = await prisma.centroDistribuicao.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Centro não encontrado')
  return prisma.centroDistribuicao.update({ where: { id }, data: input })
}

export async function deleteCentroService(id: string) {
  const existing = await prisma.centroDistribuicao.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Centro não encontrado')
  await prisma.centroDistribuicao.delete({ where: { id } })
}

export async function uploadCentrosCsvService(csvText: string) {
  const { data: rows, errors } = Papa.parse<CentroCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, ''),
  })

  if (errors.length > 0) throw new HttpError(422, 'Erro ao parsear CSV')

  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const codigo = String(row.codigo ?? '').trim().toUpperCase()
    const label = String(row.label ?? row.nome ?? '').trim()
    if (!codigo || !label) continue

    const parsed = adminCentroSchema.safeParse({ codigo, label })
    if (!parsed.success) continue

    const existing = await prisma.centroDistribuicao.findUnique({ where: { codigo } })
    if (existing) {
      await prisma.centroDistribuicao.update({ where: { codigo }, data: { label: parsed.data.label } })
      updated++
    } else {
      await prisma.centroDistribuicao.create({ data: parsed.data })
      inserted++
    }
  }

  return { message: 'Importação concluída', inserted, updated }
}
