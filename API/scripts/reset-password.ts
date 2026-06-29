import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email       = 'wagner.gomes.cx2@gmail.com'
  const newPassword = 'Test123'

  const hash = await bcrypt.hash(newPassword, 12)

  const user = await prisma.user.update({
    where: { email },
    data:  { passwordHash: hash },
    select: { email: true, role: true, setor: true },
  })

  console.log('\n✅ Senha redefinida com sucesso!')
  console.log(`   email: ${user.email}`)
  console.log(`   role:  ${user.role}`)
  console.log(`   setor: ${user.setor}`)
  console.log(`   nova senha: ${newPassword}\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
