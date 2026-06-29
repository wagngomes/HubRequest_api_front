import type { FastifyRequest, FastifyReply } from 'fastify'
import { logAudit, diffObjects } from '../lib/audit.js'
import { prisma } from '../lib/prisma.js'
import type {
  SolicitacaoTransferenciaInput,
  TransferenciaStatusInput,
  TransferenciaItemStatusInput,
} from '../lib/validations/transferencia.js'
import {
  listTransferenciasService,
  createTransferenciaService,
  exportTransferenciasService,
  getTransferenciaService,
  updateTransferenciaService,
  deleteTransferenciaService,
  getTransferenciaItemService,
  updateTransferenciaItemService,
} from '../services/transferencias.js'

export async function listTransferencias(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listTransferenciasService({
    ...(request.query as { page: number; limit: number; search: string; supridor: string; status?: 'PENDENTE' | 'PROCESSADA' }),
    caller: request.user,
  }))
}

export async function createTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const data = await createTransferenciaService(request.body as SolicitacaoTransferenciaInput, request.user)

  logAudit({
    actor: request.user,
    action: 'CREATE',
    entity: 'SolicitacaoTransferencia',
    entityId: data.id,
    changes: { status: { from: null, to: data.status }, totalItens: { from: null, to: data._count.itens } },
    ip: request.ip,
  })

  return reply.status(201).send({ data })
}

export async function exportTransferencias(request: FastifyRequest, reply: FastifyReply) {
  const { buffer, filename } = await exportTransferenciasService(
    request.query as { search: string; supridor: string; status?: 'PENDENTE' | 'PROCESSADA' },
  )
  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(buffer)
}

export async function getTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send({ data: await getTransferenciaService(id, request.user) })
}

export async function updateTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const old = await prisma.solicitacaoTransferencia.findUnique({
    where: { id },
    select: { status: true, obs: true },
  })

  const data = await updateTransferenciaService(id, request.body as TransferenciaStatusInput)

  if (old) {
    logAudit({
      actor: request.user,
      action: 'UPDATE',
      entity: 'SolicitacaoTransferencia',
      entityId: data.id,
      changes: diffObjects(old as Record<string, unknown>, { status: data.status, obs: data.obs }),
      ip: request.ip,
    })
  }

  return reply.send({ data })
}

export async function deleteTransferencia(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteTransferenciaService(id, request.user)

  logAudit({
    actor: request.user,
    action: 'DELETE',
    entity: 'SolicitacaoTransferencia',
    entityId: id,
    ip: request.ip,
  })

  return reply.send({ message: 'Excluído com sucesso' })
}

export async function getTransferenciaItem(request: FastifyRequest, reply: FastifyReply) {
  const { itemId } = request.params as { itemId: string }
  return reply.send({ data: await getTransferenciaItemService(itemId, request.user) })
}

export async function updateTransferenciaItem(request: FastifyRequest, reply: FastifyReply) {
  const { itemId } = request.params as { itemId: string }
  const old = await prisma.transferencia.findUnique({
    where: { id: itemId },
    select: { status: true, obs: true, notaFiscal: true },
  })

  const data = await updateTransferenciaItemService(itemId, request.body as TransferenciaItemStatusInput)

  logAudit({
    actor: request.user,
    action: 'UPDATE',
    entity: 'TransferenciaItem',
    entityId: data.id,
    changes: diffObjects(
      { status: old?.status ?? null, obs: old?.obs ?? null, notaFiscal: old?.notaFiscal ?? null },
      { status: data.status,         obs: data.obs,         notaFiscal: data.notaFiscal ?? null },
    ),
    ip: request.ip,
  })

  return reply.send({ data })
}
