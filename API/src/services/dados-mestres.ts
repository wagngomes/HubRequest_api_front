import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/errors.js'

export async function listCentrosService() {
  return prisma.centroDistribuicao.findMany({ orderBy: { codigo: 'asc' } })
}

export async function listSlasService() {
  return prisma.sla.findMany({ orderBy: { origem: 'asc' } })
}

export async function listRestricoesService() {
  return prisma.restricaoTribTransf.findMany({ orderBy: { tributacao: 'asc' } })
}

export async function getConstantesService() {
  const data = await prisma.constantes.findUnique({ where: { id: 'singleton' } })
  return data ?? { minimoTransferencia: 0, minimoPitagoras: 0 }
}

export async function getProdutoByCodigoService(codigo: string) {
  const produto = await prisma.product.findUnique({
    where: { codigo },
    include: { marcaObj: true },
  })
  if (!produto) throw new HttpError(404, 'Produto não encontrado')
  return produto
}
