import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/errors.js'
import { generateSolicitacaoId } from '../lib/id.js'
import {
  sendNovaSolicitacaoEmail,
  sendConfirmacaoSolicitacaoEmail,
  sendStatusAtualizadoEmail,
} from '../lib/email/send.js'
import { solicitacoesTotal } from '../lib/metrics.js'
import type {
  SolicitacaoLiberacaoInput,
  LiberacaoRetornoInput,
  LiberacaoItemStatusInput,
} from '../lib/validations/liberacao.js'
import type { RequestUser } from '../lib/auth/middleware.js'

export type LiberacoesListInput = {
  page: number
  limit: number
  search: string
  status?: 'PENDENTE' | 'PROCESSADA'
  caller: RequestUser
}

export async function listLiberacoesService(input: LiberacoesListInput) {
  const { page, limit, search, status, caller } = input
  const skip = (page - 1) * limit

  const where = {
    ...(caller.setor === 'PLANEJAMENTO' ? {} : { solicitacao: { userId: caller.id } }),
    ...(status ? { solicitacao: { status } } : {}),
    ...(search
      ? {
          OR: [
            { solicitacaoId: { contains: search } },
            { codigo: { contains: search } },
            { descricao: { contains: search } },
            {
              solicitacao: {
                OR: [
                  { contrato: { contains: search } },
                  { grupo: { contains: search } },
                  { solicitante: { contains: search } },
                ],
              },
            },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.liberacao.findMany({
      where,
      include: {
        solicitacao: {
          include: { user: { select: { id: true, nome: true, email: true, setor: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.liberacao.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function createLiberacaoService(input: SolicitacaoLiberacaoInput, caller: RequestUser) {
  const codigos = [...new Set(input.itens.map((i) => i.codigo))]
  const produtos = await prisma.product.findMany({ where: { codigo: { in: codigos } } })
  const faltando = codigos.filter((c) => !produtos.find((p) => p.codigo === c))
  if (faltando.length > 0) {
    throw new HttpError(404, `Produto(s) não encontrado(s): ${faltando.join(', ')}`)
  }

  let id = generateSolicitacaoId()
  for (let t = 0; t < 5; t++) {
    const existe = await prisma.solicitacaoLiberacao.findUnique({ where: { id } })
    if (!existe) break
    id = generateSolicitacaoId()
  }

  const { itens, obs, ...cabecalho } = input

  const solicitacao = await prisma.solicitacaoLiberacao.create({
    data: {
      id,
      ...cabecalho,
      obs,
      solicitante: caller.name,
      email: caller.email,
      userId: caller.id,
      itens: {
        create: itens.map((item) => ({
          codigo: item.codigo,
          descricao: item.descricao,
          contribuinte: item.contribuinte,
          clienteUF: item.clienteUF,
          centro: item.centro,
          cnpjCod: item.cnpjCod,
          grupo2: item.grupo2,
          quantidade: item.quantidade,
          valor: item.valor,
          linkPedidoCompl: item.linkPedidoCompl,
        })),
      },
    },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  })

  const detalhes = `Contrato: ${cabecalho.contrato} | Ação: ${cabecalho.acao} | ${itens.length} item(ns)`

  await Promise.all([
    sendNovaSolicitacaoEmail({ tipo: 'liberacao', solicitante: caller.name, detalhes, id: solicitacao.id }),
    sendConfirmacaoSolicitacaoEmail({
      destinatario: caller.email,
      nome: caller.name,
      tipo: 'liberacao',
      id: solicitacao.id,
      detalhes,
    }),
  ])

  solicitacoesTotal.inc({ tipo: 'liberacao', setor: caller.setor })

  return solicitacao
}

export async function getLiberacaoService(id: string, caller: RequestUser) {
  const item = await prisma.solicitacaoLiberacao.findUnique({
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

export async function updateLiberacaoService(id: string, input: LiberacaoRetornoInput) {
  const solicitacao = await prisma.solicitacaoLiberacao.findUnique({ where: { id }, include: { user: true } })
  if (!solicitacao) throw new HttpError(404, 'Não encontrado')

  const updated = await prisma.solicitacaoLiberacao.update({
    where: { id },
    data: {
      retornoPlanejamento: input.retornoPlanejamento,
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
    tipo: 'Liberação Pitágoras',
    novoStatus: `${input.retornoPlanejamento} / ${input.status}`,
    id: solicitacao.id,
  })

  return updated
}

export async function deleteLiberacaoService(id: string, caller: RequestUser) {
  const item = await prisma.solicitacaoLiberacao.findUnique({ where: { id } })
  if (!item) throw new HttpError(404, 'Não encontrado')
  if (caller.setor !== 'PLANEJAMENTO' && item.userId !== caller.id) throw new HttpError(403, 'Acesso negado')
  await prisma.solicitacaoLiberacao.delete({ where: { id } })
}

export async function getLiberacaoItemService(itemId: string, caller: RequestUser) {
  const item = await prisma.liberacao.findUnique({
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

export async function updateLiberacaoItemService(itemId: string, input: LiberacaoItemStatusInput) {
  const item = await prisma.liberacao.findUnique({
    where: { id: itemId },
    include: { solicitacao: { include: { user: true } } },
  })
  if (!item) throw new HttpError(404, 'Não encontrado')

  const updated = await prisma.liberacao.update({
    where: { id: itemId },
    data: { status: input.status },
    include: {
      solicitacao: { include: { user: { select: { id: true, nome: true, email: true, setor: true } } } },
    },
  })

  await sendStatusAtualizadoEmail({
    destinatario: item.solicitacao.user.email,
    nome: item.solicitacao.user.nome,
    tipo: `Liberação (item ${item.codigo})`,
    novoStatus: input.status,
    id: item.solicitacaoId,
  })

  return updated
}
