import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { adminProductSchema } from '../../lib/validations/admin.js'
import {
  listProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
  uploadProductsCsvService,
  clearProductsService,
} from '../../services/admin/products.js'

// ---------- Input schemas ----------
const listQuerySchema = z.object({
  search: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const codigoParamSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório'),
})

// ---------- Input types ----------
export type ListProductsQuery = z.infer<typeof listQuerySchema>
export type CodigoParam = z.infer<typeof codigoParamSchema>

// ---------- Handlers ----------
export async function listProducts(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
  }
  return reply.send(await listProductsService(parsed.data))
}

export async function createProduct(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminProductSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }
  const data = await createProductService(parsed.data)
  return reply.status(201).send({ data })
}

export async function updateProduct(request: FastifyRequest, reply: FastifyReply) {
  const idParsed = codigoParamSchema.safeParse(request.params)
  if (!idParsed.success) return reply.status(422).send({ error: 'Código inválido' })

  const bodyParsed = adminProductSchema.partial().safeParse(request.body)
  if (!bodyParsed.success) {
    return reply.status(422).send({ error: 'Dados inválidos', details: bodyParsed.error.flatten() })
  }

  const data = await updateProductService(idParsed.data.codigo, bodyParsed.data)
  return reply.send({ data })
}

export async function deleteProduct(request: FastifyRequest, reply: FastifyReply) {
  const parsed = codigoParamSchema.safeParse(request.params)
  if (!parsed.success) return reply.status(422).send({ error: 'Código inválido' })
  await deleteProductService(parsed.data.codigo)
  return reply.send({ message: 'Produto excluído com sucesso' })
}

export async function uploadProducts(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  if (!file.filename.endsWith('.csv')) {
    return reply.status(400).send({ error: 'Formato inválido. Envie um .csv' })
  }

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  const result = await uploadProductsCsvService(text)
  return reply.send(result)
}

export async function clearProducts(_request: FastifyRequest, reply: FastifyReply) {
  await clearProductsService()
  return reply.send({ message: 'Todos os produtos foram removidos' })
}
