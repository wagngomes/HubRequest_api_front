import * as XLSX from 'xlsx'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/errors.js'
import { generateSolicitacaoId } from '../lib/id.js'
import { addBusinessDays } from '../lib/utils.js'
import {
  sendNovaSolicitacaoEmail,
  sendConfirmacaoSolicitacaoEmail,
  sendStatusAtualizadoEmail,
  type ItemComPrevisao,
} from '../lib/email/send.js'
import { solicitacoesTotal } from '../lib/metrics.js'
import type {
  SolicitacaoTransferenciaInput,
  TransferenciaStatusInput,
  TransferenciaItemStatusInput,
} from '../lib/validations/transferencia.js'
import type { RequestUser } from '../lib/auth/middleware.js'

export type TransferenciasListInput = {
  page: number
  limit: number
  search: string
  supridor: string
  status?: 'PENDENTE' | 'PROCESSADA'
  caller: RequestUser
}

export type ExportTransferenciasInput = {
  search: string
  supridor: string
  status?: 'PENDENTE' | 'PROCESSADA'
}

export type ExportResult = {
  buffer: Buffer
  filename: string
}

export async function listTransferenciasService(input: TransferenciasListInput) {
  const { page, limit, search, supridor, status, caller } = input
  const skip = (page - 1) * limit

  const where = {
    ...(caller.setor === 'PLANEJAMENTO' ? {} : { solicitacao: { userId: caller.id } }),
    ...(status ? { status } : {}),
    ...(supridor ? { produto: { marcaObj: { supridor: { contains: supridor } } } } : {}),
    ...(search
      ? {
          OR: [
            { solicitacaoId: { contains: search } },
            { codigo: { contains: search } },
            { descricao: { contains: search } },
            { origem: { contains: search } },
            { destino: { contains: search } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.transferencia.findMany({
      where,
      include: {
        solicitacao: {
          include: { user: { select: { id: true, nome: true, email: true, setor: true } } },
        },
        produto: {
          select: {
            tributacao: true,
            multiplo: true,
            cmv: true,
            marcaObj: { select: { supridor: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transferencia.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function createTransferenciaService(
  input: SolicitacaoTransferenciaInput,
  caller: RequestUser,
) {
  const codigos = [...new Set(input.itens.map((i) => i.codigo))]
  const produtos = await prisma.product.findMany({ where: { codigo: { in: codigos } } })
  const faltando = codigos.filter((c) => !produtos.find((p) => p.codigo === c))
  if (faltando.length > 0) {
    throw new HttpError(404, `Produto(s) não encontrado(s): ${faltando.join(', ')}`)
  }

  let id = generateSolicitacaoId()
  for (let t = 0; t < 5; t++) {
    const existe = await prisma.solicitacaoTransferencia.findUnique({ where: { id } })
    if (!existe) break
    id = generateSolicitacaoId()
  }

  const solicitacao = await prisma.solicitacaoTransferencia.create({
    data: {
      id,
      obs: input.obs,
      userId: caller.id,
      itens: {
        create: input.itens.map((item) => ({
          codigo: item.codigo,
          descricao: item.descricao,
          controlado: item.controlado,
          refrigerado: item.refrigerado,
          origem: item.origem,
          destino: item.destino,
          quantidade: item.quantidade,
        })),
      },
    },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  })

  const pares = input.itens.map((i) => ({ origem: i.origem, destino: i.destino }))
  const slas = await prisma.sla.findMany({ where: { OR: pares } })
  const slaMap = new Map(slas.map((s) => [`${s.origem}|${s.destino}`, s.sla]))
  const hoje = new Date()
  const produtosMap = new Map(produtos.map((p) => [p.codigo, p]))

  const itensComPrevisao: ItemComPrevisao[] = solicitacao.itens.map((item) => {
    const sla = slaMap.get(`${item.origem}|${item.destino}`)
    const produto = produtosMap.get(item.codigo)
    const previsaoDate = sla ? addBusinessDays(hoje, sla) : null
    const previsaoStr = previsaoDate
      ? previsaoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : undefined
    return {
      codigo: item.codigo,
      descricao: produto?.descricao ?? item.descricao,
      origem: item.origem,
      destino: item.destino,
      quantidade: item.quantidade,
      previsaoChegada: previsaoStr,
    }
  })

  await Promise.all(
    solicitacao.itens.map((item, idx) => {
      const previsao = itensComPrevisao[idx]?.previsaoChegada
      if (!previsao) return Promise.resolve()
      return prisma.transferencia.update({ where: { id: item.id }, data: { dataPrevisaoChegada: previsao } })
    }),
  )

  const resumo = input.itens
    .map((i) => `${i.codigo} – ${i.origem} → ${i.destino} (${i.quantidade}un)`)
    .join('; ')

  await Promise.all([
    sendNovaSolicitacaoEmail({
      tipo: 'transferencia',
      solicitante: caller.name,
      detalhes: resumo,
      id: solicitacao.id,
      itensComPrevisao,
    }),
    sendConfirmacaoSolicitacaoEmail({
      destinatario: caller.email,
      nome: caller.name,
      tipo: 'transferencia',
      id: solicitacao.id,
      detalhes: resumo,
      itensComPrevisao,
    }),
  ])

  solicitacoesTotal.inc({ tipo: 'transferencia', setor: caller.setor })

  return solicitacao
}

export async function exportTransferenciasService(input: ExportTransferenciasInput): Promise<ExportResult> {
  const where = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.supridor ? { produto: { marcaObj: { supridor: { contains: input.supridor } } } } : {}),
    ...(input.search
      ? {
          OR: [
            { solicitacaoId: { contains: input.search } },
            { codigo: { contains: input.search } },
            { descricao: { contains: input.search } },
            { origem: { contains: input.search } },
            { destino: { contains: input.search } },
          ],
        }
      : {}),
  }

  const items = await prisma.transferencia.findMany({
    where,
    select: { codigo: true, origem: true, destino: true, refrigerado: true, quantidade: true },
    orderBy: { createdAt: 'asc' },
  })

  type GroupEntry = { origem: string; destino: string; codigo: string; refrigerado: string; quantidade: number }
  const groups = new Map<string, GroupEntry>()
  for (const item of items) {
    const key = `${item.codigo}|${item.origem}|${item.destino}`
    const existing = groups.get(key)
    if (existing) {
      existing.quantidade += item.quantidade
    } else {
      groups.set(key, { ...item, refrigerado: item.refrigerado as string })
    }
  }

  const rows = Array.from(groups.values())
  const refrigerados = rows.filter((r) => r.refrigerado === 'S')
  const normais = rows.filter((r) => r.refrigerado !== 'S')

  const toSheet = (data: GroupEntry[]) =>
    XLSX.utils.json_to_sheet(
      data.map((r) => ({
        CD_ORI: r.origem.padStart(6, '0'),
        CD_DEST: r.destino.padStart(6, '0'),
        ARM_ORI: '01',
        ARM_DEST: '01',
        PRODUTO: r.codigo.padStart(6, '0'),
        QUANT: r.quantidade,
        ID_OF: '',
        OBS: '',
      })),
    )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, toSheet(refrigerados), 'Refrigerados')
  XLSX.utils.book_append_sheet(wb, toSheet(normais), 'Nao Refrigerados')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const date = new Date().toISOString().slice(0, 10)
  return { buffer, filename: `transferencias_${date}.xlsx` }
}

export async function getTransferenciaService(id: string, caller: RequestUser) {
  const item = await prisma.solicitacaoTransferencia.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  })
  if (!item) throw new HttpError(404, 'Não encontrado')
  if (caller.setor !== 'PLANEJAMENTO' && item.userId !== caller.id) throw new HttpError(403, 'Não autorizado')
  return item
}

export async function updateTransferenciaService(id: string, input: TransferenciaStatusInput) {
  const solicitacao = await prisma.solicitacaoTransferencia.findUnique({ where: { id }, include: { user: true } })
  if (!solicitacao) throw new HttpError(404, 'Não encontrado')

  const updated = await prisma.solicitacaoTransferencia.update({
    where: { id },
    data: {
      status: input.status,
      ...(input.obs !== undefined ? { obs: input.obs } : {}),
    },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  })

  await sendStatusAtualizadoEmail({
    destinatario: solicitacao.user.email,
    nome: solicitacao.user.nome,
    tipo: 'Transferência',
    novoStatus: input.status,
    id: solicitacao.id,
  })

  return updated
}

export async function deleteTransferenciaService(id: string, caller: RequestUser) {
  const item = await prisma.solicitacaoTransferencia.findUnique({ where: { id } })
  if (!item) throw new HttpError(404, 'Não encontrado')
  if (caller.setor !== 'PLANEJAMENTO' && item.userId !== caller.id) throw new HttpError(403, 'Acesso negado')
  await prisma.solicitacaoTransferencia.delete({ where: { id } })
}

export async function getTransferenciaItemService(itemId: string, caller: RequestUser) {
  const item = await prisma.transferencia.findUnique({
    where: { id: itemId },
    include: {
      solicitacao: { include: { user: { select: { id: true, nome: true, email: true, setor: true } } } },
    },
  })
  if (!item) throw new HttpError(404, 'Não encontrado')
  if (caller.setor !== 'PLANEJAMENTO' && item.solicitacao.userId !== caller.id) {
    throw new HttpError(403, 'Não autorizado')
  }
  return item
}

export async function updateTransferenciaItemService(itemId: string, input: TransferenciaItemStatusInput) {
  const item = await prisma.transferencia.findUnique({
    where: { id: itemId },
    include: { solicitacao: { include: { user: true } } },
  })
  if (!item) throw new HttpError(404, 'Não encontrado')

  const updateData: Record<string, unknown> = {
    status: input.status,
    obs: input.obs?.trim() || '-',
  }

  if (input.status === 'PROCESSADA' && input.notaFiscal) {
    updateData.notaFiscal = input.notaFiscal.trim()
  }

  if (input.status === 'PROCESSADA') {
    const produto = await prisma.product.findUnique({
      where: { codigo: item.codigo },
      select: { marcaObj: { select: { supridor: true } } },
    })
    updateData.supridorSnapshot = produto?.marcaObj?.supridor ?? null
  }

  const updated = await prisma.transferencia.update({
    where: { id: itemId },
    data: updateData,
    include: {
      solicitacao: { include: { user: { select: { id: true, nome: true, email: true, setor: true } } } },
    },
  })

  await sendStatusAtualizadoEmail({
    destinatario: item.solicitacao.user.email,
    nome: item.solicitacao.user.nome,
    tipo: `Transferência (item ${item.codigo})`,
    novoStatus: input.status,
    notaFiscal: input.notaFiscal,
    obs: input.obs?.trim(),
    id: item.solicitacaoId,
  })

  return updated
}
