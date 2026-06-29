import { prisma } from '../lib/prisma.js'
import { HttpError } from '../lib/errors.js'
import type { TravaMensagemInput } from '../lib/validations/admin.js'
import type { RequestUser } from '../lib/auth/middleware.js'

export async function listTravaMensagensService(travaId: string) {
  const trava = await prisma.trava.findUnique({ where: { id: travaId } })
  if (!trava) throw new HttpError(404, 'Trava não encontrada')

  return prisma.travaMensagem.findMany({
    where: { travaId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
    },
  })
}

export async function createTravaMensagemService(
  travaId: string,
  input: TravaMensagemInput,
  caller: RequestUser,
) {
  const trava = await prisma.trava.findUnique({ where: { id: travaId } })
  if (!trava) throw new HttpError(404, 'Trava não encontrada')

  return prisma.travaMensagem.create({
    data: { travaId, userId: caller.id, texto: input.texto },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
    },
  })
}
