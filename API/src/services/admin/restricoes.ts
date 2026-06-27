import { prisma } from '../../lib/prisma.js'
import { HttpError } from '../../lib/errors.js'
import type { AdminRestricaoInput } from '../../lib/validations/admin.js'

export async function listRestricoesAdminService() {
  return prisma.restricaoTribTransf.findMany({ orderBy: { tributacao: 'asc' } })
}

export async function createRestricaoService(input: AdminRestricaoInput) {
  const existing = await prisma.restricaoTribTransf.findUnique({
    where: { tributacao_origem_destino: input },
  })
  if (existing) throw new HttpError(409, 'Restrição já cadastrada')
  return prisma.restricaoTribTransf.create({ data: input })
}

export async function deleteRestricaoService(id: string) {
  const existing = await prisma.restricaoTribTransf.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Restrição não encontrada')
  await prisma.restricaoTribTransf.delete({ where: { id } })
}
