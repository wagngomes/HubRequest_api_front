import Papa from 'papaparse'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/errors.js'
import { travaSchema } from '../lib/validations/admin.js'
import type { TravaInput } from '../lib/validations/admin.js'
import type { AreaTrava } from '@prisma/client'

export type TravasListInput = {
  page: number
  limit: number
  search: string
  area?: AreaTrava
  status?: 'ATIVA' | 'INATIVA'
}

interface TravaCSVRow {
  trava?: string
  area?: string
  solicitacao?: string
  aprovadores?: string
  status?: string
  nome_trava?: string
  nometrava?: string
  mensagem_customizada?: string
  mensagemcustomizada?: string
  motivo_detalhamento?: string
  motivodetalhamento?: string
  data_solicitacao?: string
  datasolicitacao?: string
  trans_ou_venda?: string
  transOuVenda?: string
  transOuvenda?: string
  sales_ou_money?: string
  salesOuMoney?: string
  salesOumoney?: string
  data_atualizacao?: string
  dataatualizacao?: string
  motivo_atualizacao?: string
  motivoatualizacao?: string
}

function mapArea(raw: string): AreaTrava {
  const upper = raw.trim().toUpperCase()
  const valid: AreaTrava[] = ['COMERCIAL', 'COMPRAS', 'PLANEJAMENTO', 'PRICING', 'FISCAL', 'OUTRAS']
  return valid.includes(upper as AreaTrava) ? (upper as AreaTrava) : 'OUTRAS'
}

function mapStatus(raw: string): 'ATIVA' | 'INATIVA' {
  const upper = raw.trim().toUpperCase()
  if (upper === 'ATIVA' || upper === 'MANTER') return 'ATIVA'
  if (upper === 'INATIVA' || upper === 'CANCELAR') return 'INATIVA'
  return 'ATIVA'
}

function mapSistema(raw: string): 'MONEY' | 'SALESFORCE' | 'MONEY_SALESFORCE' {
  const upper = raw.trim().toUpperCase().replace(/[^A-Z]/g, '_').replace(/_+/g, '_')
  if (upper === 'MONEY') return 'MONEY'
  if (upper === 'SALESFORCE') return 'SALESFORCE'
  return 'MONEY_SALESFORCE'
}

function mapTransVenda(raw: string): 'TRANSF' | 'VENDA' {
  return raw.trim().toUpperCase() === 'TRANSF' ? 'TRANSF' : 'VENDA'
}

export async function listTravasService(input: TravasListInput) {
  const { page, limit, search, area, status } = input
  const skip = (page - 1) * limit

  const where = {
    ...(area ? { area } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { trava: { contains: search, mode: 'insensitive' as const } },
            { nomeTrava: { contains: search, mode: 'insensitive' as const } },
            { mensagemCustomizada: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.trava.findMany({ where, skip, take: limit, orderBy: { area: 'asc' } }),
    prisma.trava.count({ where }),
  ])

  return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function listTravasByAreaService() {
  const areas: AreaTrava[] = ['COMERCIAL', 'COMPRAS', 'PLANEJAMENTO', 'PRICING', 'FISCAL', 'OUTRAS']
  const counts = await prisma.trava.groupBy({ by: ['area'], _count: { id: true } })
  return areas.map((area) => ({
    area,
    total: counts.find((c) => c.area === area)?._count.id ?? 0,
  }))
}

export async function getTravaService(id: string) {
  const trava = await prisma.trava.findUnique({ where: { id } })
  if (!trava) throw new HttpError(404, 'Trava não encontrada')
  return trava
}

export async function createTravaService(input: TravaInput) {
  return prisma.trava.create({ data: input })
}

export async function updateTravaService(id: string, input: Partial<TravaInput>) {
  const existing = await prisma.trava.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Trava não encontrada')
  return prisma.trava.update({ where: { id }, data: input })
}

export async function deleteTravaService(id: string) {
  const existing = await prisma.trava.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Trava não encontrada')
  await prisma.trava.delete({ where: { id } })
}

export async function clearTravasService() {
  const { count } = await prisma.trava.deleteMany()
  return { deleted: count }
}

export async function uploadTravasCsvService(csvText: string) {
  const { data: rows, errors } = Papa.parse<TravaCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) =>
      h.trim().toLowerCase().replace(/\s+/g, '').replace(/_/g, ''),
  })

  if (errors.length > 0) throw new HttpError(422, 'Erro ao parsear CSV')

  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const trava = String(row.trava ?? '').trim()
    const areaRaw = String(row.area ?? '').trim()
    if (!trava || !areaRaw) continue

    const aprovadoresRaw = String(row.aprovadores ?? '').trim()
    const aprovadores = aprovadoresRaw
      ? aprovadoresRaw.split(/[,;\n]+/).map((a) => a.trim()).filter(Boolean)
      : []

    const parsed = travaSchema.safeParse({
      trava,
      area: mapArea(areaRaw),
      solicitacao:         String(row.solicitacao ?? '').trim(),
      aprovadores,
      status:              mapStatus(String(row.status ?? 'ATIVA')),
      nomeTrava:           String(row.nometrava ?? row.nome_trava ?? '').trim(),
      mensagemCustomizada: String(row.mensagemcustomizada ?? row.mensagem_customizada ?? '').trim(),
      motivoDetalhamento:  String(row.motivodetalhamento ?? row.motivo_detalhamento ?? '').trim(),
      dataSolicitacao:     String(row.datasolicitacao ?? row.data_solicitacao ?? '').trim(),
      transOuVenda:        mapTransVenda(String(row.transOuvenda ?? row.trans_ou_venda ?? 'VENDA')),
      salesOuMoney:        mapSistema(String(row.salesOumoney ?? row.sales_ou_money ?? 'MONEY_SALESFORCE')),
      dataAtualizacao:     String(row.dataatualizacao ?? row.data_atualizacao ?? '').trim(),
      motivoAtualizacao:   String(row.motivoatualizacao ?? row.motivo_atualizacao ?? '').trim(),
    })

    if (!parsed.success) continue

    const existing = await prisma.trava.findFirst({ where: { trava, area: parsed.data.area } })
    if (existing) {
      await prisma.trava.update({ where: { id: existing.id }, data: parsed.data })
      updated++
    } else {
      await prisma.trava.create({ data: parsed.data })
      inserted++
    }
  }

  return { message: 'Importação concluída', inserted, updated }
}
