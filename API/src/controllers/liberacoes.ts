import type { FastifyRequest, FastifyReply } from 'fastify'
import { logAudit, diffObjects } from '../lib/audit.js'
import { prisma } from '../lib/prisma.js'
import type {
  SolicitacaoLiberacaoInput,
  LiberacaoRetornoInput,
  LiberacaoItemStatusInput,
} from '../lib/validations/liberacao.js'
import {
  listLiberacoesService,
  createLiberacaoService,
  getLiberacaoService,
  updateLiberacaoService,
  deleteLiberacaoService,
  getLiberacaoItemService,
  updateLiberacaoItemService,
} from '../services/liberacoes.js'

export async function listLiberacoes(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listLiberacoesService({
    ...(request.query as { page: number; limit: number; search: string; status?: 'PENDENTE' | 'PROCESSADA' }),
    caller: request.user,
  }))
}

export async function createLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const data = await createLiberacaoService(request.body as SolicitacaoLiberacaoInput, request.user)

  logAudit({
    actor: request.user,
    action: 'CREATE',
    entity: 'SolicitacaoLiberacao',
    entityId: data.id,
    changes: {
      contrato:   { from: null, to: data.contrato },
      acao:       { from: null, to: data.acao },
      status:     { from: null, to: data.status },
      totalItens: { from: null, to: data._count.itens },
    },
    ip: request.ip,
  })

  return reply.status(201).send({ data })
}

export async function getLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await getLiberacaoService(id, request.user) })
}

export async function updateLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const old = await prisma.solicitacaoLiberacao.findUnique({
    where: { id },
    select: { status: true, retornoPlanejamento: true, obs: true },
  })

  const data = await updateLiberacaoService(id, request.body as LiberacaoRetornoInput)

  if (old) {
    logAudit({
      actor: request.user,
      action: 'UPDATE',
      entity: 'SolicitacaoLiberacao',
      entityId: data.id,
      changes: diffObjects(
        old as Record<string, unknown>,
        { status: data.status, retornoPlanejamento: data.retornoPlanejamento, obs: data.obs },
      ),
      ip: request.ip,
    })
  }

  return reply.send({ data })
}

export async function deleteLiberacao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteLiberacaoService(id, request.user)

  logAudit({
    actor: request.user,
    action: 'DELETE',
    entity: 'SolicitacaoLiberacao',
    entityId: id,
    ip: request.ip,
  })

  return reply.send({ message: 'Excluído com sucesso' })
}

export async function getLiberacaoItem(request: FastifyRequest, reply: FastifyReply) {
  const { itemId } = request.params as { itemId: string }
  return reply.send({ data: await getLiberacaoItemService(itemId, request.user) })
}

export async function updateLiberacaoItem(request: FastifyRequest, reply: FastifyReply) {
  const { itemId } = request.params as { itemId: string }
  const old = await prisma.liberacao.findUnique({
    where: { id: itemId },
    select: { status: true, codigo: true, solicitacaoId: true },
  })

  const data = await updateLiberacaoItemService(itemId, request.body as LiberacaoItemStatusInput)

  logAudit({
    actor: request.user,
    action: 'UPDATE',
    entity: 'LiberacaoItem',
    entityId: data.id,
    changes: {
      status:        { from: old?.status        ?? null, to: data.status },
      codigo:        { from: old?.codigo        ?? null, to: data.codigo },
      solicitacaoId: { from: old?.solicitacaoId ?? null, to: data.solicitacaoId },
    },
    ip: request.ip,
  })

  return reply.send({ data })
}
