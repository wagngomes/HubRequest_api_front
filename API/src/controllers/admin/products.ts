import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AdminProductInput } from '../../lib/validations/admin.js'
import { validateCsvFile } from '../../lib/file-validation.js'
import {
  listProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
  uploadProductsCsvService,
  clearProductsService,
} from '../../services/admin/products.js'

export async function listProducts(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listProductsService(request.query as { search: string; page: number; limit: number }))
}

export async function createProduct(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({ data: await createProductService(request.body as AdminProductInput) })
}

export async function updateProduct(request: FastifyRequest, reply: FastifyReply) {
  const { codigo } = request.params as { codigo: string }
  return reply.send({ data: await updateProductService(codigo, request.body as Partial<AdminProductInput>) })
}

export async function deleteProduct(request: FastifyRequest, reply: FastifyReply) {
  const { codigo } = request.params as { codigo: string }
  await deleteProductService(codigo)
  return reply.send({ message: 'Produto excluído com sucesso' })
}

export async function uploadProducts(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' })
  const fileError = validateCsvFile(file.filename, file.mimetype)
  if (fileError) return reply.status(400).send({ error: fileError })

  const chunks: Buffer[] = []
  for await (const chunk of file.file) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf-8')

  return reply.send(await uploadProductsCsvService(text))
}

export async function clearProducts(_request: FastifyRequest, reply: FastifyReply) {
  await clearProductsService()
  return reply.send({ message: 'Todos os produtos foram removidos' })
}
