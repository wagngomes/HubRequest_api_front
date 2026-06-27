import { prisma } from '../lib/prisma.js'
import { businessHoursBetween } from '../lib/business-hours.js'

export type DashboardInput = {
  mes: number
  ano: number
}

export async function getDashboardService(input: DashboardInput) {
  const { mes, ano } = input
  const startDate = new Date(ano, mes - 1, 1)
  const endDate = new Date(ano, mes, 1)

  const transItems = await prisma.transferencia.findMany({
    where: { solicitacao: { createdAt: { gte: startDate, lt: endDate } } },
    include: {
      solicitacao: { select: { createdAt: true } },
      produto: { select: { marcaObj: { select: { supridor: true } } } },
    },
  })

  const transPendentes = transItems.filter((i) => i.status === 'PENDENTE').length
  const transProcessadas = transItems.filter((i) => i.status === 'PROCESSADA').length

  const temposTransf = transItems
    .filter((i) => i.status === 'PROCESSADA')
    .map((i) => businessHoursBetween(new Date(i.solicitacao.createdAt), new Date(i.updatedAt)))
    .filter((h) => h > 0)

  const tempoMedioTransf =
    temposTransf.length > 0 ? temposTransf.reduce((a, b) => a + b, 0) / temposTransf.length : null

  const rotaMap = new Map<string, { origem: string; destino: string; pendentes: number; total: number }>()
  for (const item of transItems) {
    const key = `${item.origem}|${item.destino}`
    const r = rotaMap.get(key) ?? { origem: item.origem, destino: item.destino, total: 0, pendentes: 0 }
    r.total++
    if (item.status === 'PENDENTE') r.pendentes++
    rotaMap.set(key, r)
  }
  const porRota = Array.from(rotaMap.values()).sort((a, b) => b.total - a.total).slice(0, 12)

  const supMap = new Map<string, { tempos: number[]; total: number }>()
  for (const item of transItems) {
    const sup =
      item.status === 'PROCESSADA' && item.supridorSnapshot
        ? item.supridorSnapshot
        : (item.produto?.marcaObj?.supridor ?? '—')
    const entry = supMap.get(sup) ?? { tempos: [], total: 0 }
    entry.total++
    if (item.status === 'PROCESSADA') {
      const h = businessHoursBetween(new Date(item.solicitacao.createdAt), new Date(item.updatedAt))
      if (h > 0) entry.tempos.push(h)
    }
    supMap.set(sup, entry)
  }
  const porSupridor = Array.from(supMap.entries())
    .map(([supridor, v]) => ({
      supridor,
      total: v.total,
      tempoMedioHoras: v.tempos.length > 0 ? v.tempos.reduce((a, b) => a + b, 0) / v.tempos.length : null,
    }))
    .filter((s) => s.tempoMedioHoras !== null)
    .sort((a, b) => (b.tempoMedioHoras ?? 0) - (a.tempoMedioHoras ?? 0))
    .slice(0, 10)

  const liberacoes = await prisma.solicitacaoLiberacao.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
  })

  const liberPendentes = liberacoes.filter((l) => l.status === 'PENDENTE').length
  const liberProcessadas = liberacoes.filter((l) => l.status === 'PROCESSADA').length

  const temposLiber = liberacoes
    .filter((l) => l.status === 'PROCESSADA')
    .map((l) => businessHoursBetween(new Date(l.createdAt), new Date(l.updatedAt)))
    .filter((h) => h > 0)

  const tempoMedioLiber =
    temposLiber.length > 0 ? temposLiber.reduce((a, b) => a + b, 0) / temposLiber.length : null

  return {
    periodo: { mes, ano },
    transferencias: {
      pendentes: transPendentes,
      processadas: transProcessadas,
      total: transItems.length,
      tempoMedioHoras: tempoMedioTransf,
      porRota,
    },
    liberacoes: {
      pendentes: liberPendentes,
      processadas: liberProcessadas,
      total: liberacoes.length,
      tempoMedioHoras: tempoMedioLiber,
    },
    porSupridor,
  }
}
