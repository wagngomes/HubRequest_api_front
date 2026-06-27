import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  listCentrosService,
  listSlasService,
  listRestricoesService,
  getConstantesService,
  getProdutoByCodigoService,
} from '../services/dados-mestres.js'

// ---------- Input schemas ----------
const codigoParamSchema = z.object({
  codigo: z.string().min(1, 'Código do produto obrigatório'),
})

// ---------- Input types ----------
export type CodigoParam = z.infer<typeof codigoParamSchema>

// ---------- Handlers ----------
export async function listCentros(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listCentrosService()
  return reply.send({ data })
}

export async function listSlas(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listSlasService()
  return reply.send({ data })
}

export async function listRestricoes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await listRestricoesService()
  return reply.send({ data })
}

export async function getConstantes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await getConstantesService()
  return reply.send({ data })
}

export async function getProdutoByCodigo(request: FastifyRequest, reply: FastifyReply) {
  const parsed = codigoParamSchema.safeParse(request.params)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetro inválido', details: parsed.error.flatten() })
  }
  const data = await getProdutoByCodigoService(parsed.data.codigo)
  return reply.send({ data })
}
