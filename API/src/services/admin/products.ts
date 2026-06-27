import Papa from 'papaparse'
import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import { adminProductSchema } from '../../lib/validations/admin.js'
import type { AdminProductInput } from '../../lib/validations/admin.js'

interface ProductCSVRow {
  codigo?: string
  descricao?: string
  marca?: string
  refrigerado?: string
  controlado?: string
  cmv?: string
  tributacao?: string
  multiplo?: string
}

export type ProductsListInput = {
  search: string
  page: number
  limit: number
}

export async function listProductsService(input: ProductsListInput) {
  const { search, page, limit } = input
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { codigo: { contains: search } },
          { descricao: { contains: search } },
          { marca: { contains: search } },
        ],
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { codigo: 'asc' }, skip, take: limit }),
    prisma.product.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function createProductService(input: AdminProductInput) {
  const codigo = input.codigo.trim().toUpperCase()

  const existing = await prisma.product.findUnique({ where: { codigo } })
  if (existing) throw new HttpError(409, 'Produto com este código já existe')

  await prisma.marca.upsert({
    where: { marca: input.marca },
    update: {},
    create: { marca: input.marca, supridor: '-', emailSupridor: '' },
  })

  return prisma.product.create({ data: { ...input, codigo } })
}

export async function updateProductService(codigo: string, input: Partial<AdminProductInput>) {
  const existing = await prisma.product.findUnique({ where: { codigo } })
  if (!existing) throw new HttpError(404, 'Produto não encontrado')

  return prisma.product.update({ where: { codigo }, data: input })
}

export async function deleteProductService(codigo: string) {
  const existing = await prisma.product.findUnique({ where: { codigo } })
  if (!existing) throw new HttpError(404, 'Produto não encontrado')

  await prisma.product.delete({ where: { codigo } })
}

export async function uploadProductsCsvService(csvText: string) {
  const { data: rows, errors } = Papa.parse<ProductCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, ''),
  })

  if (errors.length > 0) throw new HttpError(422, 'Erro ao parsear CSV')

  let inserted = 0
  let updated = 0
  const erros: string[] = []

  for (const row of rows) {
    const codigo = String(row.codigo ?? '').trim().toUpperCase()
    if (!codigo) continue

    const parsed = adminProductSchema.safeParse({
      codigo,
      descricao: row.descricao?.trim() ?? '',
      marca: row.marca?.trim() ?? '',
      refrigerado: row.refrigerado?.trim().toUpperCase() ?? 'N',
      controlado: row.controlado?.trim().toUpperCase() ?? 'N',
      cmv: parseFloat(row.cmv ?? '0') || 0,
      tributacao: row.tributacao?.trim() ?? '-',
      multiplo: parseInt(row.multiplo ?? '1') || 1,
    })

    if (!parsed.success) {
      erros.push(`${codigo}: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`)
      continue
    }

    await prisma.marca.upsert({
      where: { marca: parsed.data.marca },
      update: {},
      create: { marca: parsed.data.marca, supridor: '-', emailSupridor: '' },
    })

    const existing = await prisma.product.findUnique({ where: { codigo } })
    if (existing) {
      await prisma.product.update({ where: { codigo }, data: parsed.data })
      updated++
    } else {
      await prisma.product.create({ data: parsed.data })
      inserted++
    }
  }

  return { message: 'Importação concluída', inserted, updated, erros: erros.slice(0, 10) }
}

export async function clearProductsService() {
  await prisma.product.deleteMany()
}
