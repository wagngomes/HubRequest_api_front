import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import type { AdminCentroInput } from '../../lib/validations/admin.js'

export async function listCentrosAdminService() {
  return prisma.centroDistribuicao.findMany({ orderBy: { codigo: 'asc' } })
}

export async function createCentroService(input: AdminCentroInput) {
  const existing = await prisma.centroDistribuicao.findUnique({ where: { codigo: input.codigo } })
  if (existing) throw new HttpError(409, 'Centro com este código já existe')
  return prisma.centroDistribuicao.create({ data: input })
}

export async function updateCentroService(id: string, input: Partial<AdminCentroInput>) {
  const existing = await prisma.centroDistribuicao.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Centro não encontrado')
  return prisma.centroDistribuicao.update({ where: { id }, data: input })
}

export async function deleteCentroService(id: string) {
  const existing = await prisma.centroDistribuicao.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Centro não encontrado')
  await prisma.centroDistribuicao.delete({ where: { id } })
}
