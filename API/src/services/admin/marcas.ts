import Papa from 'papaparse'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import { adminMarcaSchema } from '../../lib/validations/admin.js'
import type { AdminMarcaInput } from '../../lib/validations/admin.js'

interface MarcaCSVRow {
  marca?: string
  supridor?: string
  emailsupridor?: string
}

export type MarcasListInput = {
  search: string
  page: number
  limit: number
}

export async function listMarcasService(input: MarcasListInput) {
  const { search, page, limit } = input
  const skip = (page - 1) * limit

  const where = search
    ? { OR: [{ marca: { contains: search } }, { supridor: { contains: search } }] }
    : {}

  const [data, total] = await Promise.all([
    prisma.marca.findMany({ where, orderBy: { marca: 'asc' }, skip, take: limit }),
    prisma.marca.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function createMarcaService(input: AdminMarcaInput) {
  const existing = await prisma.marca.findUnique({ where: { marca: input.marca } })
  if (existing) throw new HttpError(409, 'Marca já cadastrada')
  return prisma.marca.create({ data: input })
}

export async function updateMarcaService(id: string, input: Partial<AdminMarcaInput>) {
  const existing = await prisma.marca.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Marca não encontrada')
  return prisma.marca.update({ where: { id }, data: input })
}

export async function deleteMarcaService(id: string) {
  const existing = await prisma.marca.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Marca não encontrada')
  await prisma.marca.delete({ where: { id } })
}

export async function uploadMarcasCsvService(csvText: string) {
  const { data: rows, errors } = Papa.parse<MarcaCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, ''),
  })

  if (errors.length > 0) throw new HttpError(422, 'Erro ao parsear CSV')

  const validRows = rows.filter((row) => row.marca?.trim())
  if (validRows.length === 0) {
    throw new HttpError(422, 'CSV sem dados válidos. Colunas: marca, supridor, emailsupridor')
  }

  let inserted = 0
  let updated = 0

  for (const row of validRows) {
    const marca = String(row.marca!).trim()
    const supridor = String(row.supridor ?? '').trim() || '-'
    const emailSupridor = String(row.emailsupridor ?? '').trim()

    const existing = await prisma.marca.findUnique({ where: { marca } })
    if (existing) {
      await prisma.marca.update({ where: { marca }, data: { supridor, emailSupridor } })
      updated++
    } else {
      const parsed = adminMarcaSchema.safeParse({ marca, supridor, emailSupridor })
      if (!parsed.success) continue
      await prisma.marca.create({ data: parsed.data })
      inserted++
    }
  }

  return { message: 'Importação concluída', inserted, updated }
}
