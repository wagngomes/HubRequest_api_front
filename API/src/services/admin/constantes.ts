import { prisma } from '../../lib/prisma.js'
import type { AdminConstantesInput } from '../../lib/validations/admin.js'

export async function getConstantesAdminService() {
  const data = await prisma.constantes.findUnique({ where: { id: 'singleton' } })
  return data ?? { minimoTransferencia: 0, minimoPitagoras: 0 }
}

export async function updateConstantesService(input: AdminConstantesInput) {
  return prisma.constantes.upsert({
    where: { id: 'singleton' },
    update: input,
    create: { id: 'singleton', ...input },
  })
}
