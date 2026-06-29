import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email    = 'wagner.gomes.cx2@gmail.com'
  const password = 'Test123'

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.log(`\n❌ Usuário não encontrado: ${email}\n`)
    return
  }

  console.log('\n✅ Usuário encontrado:')
  console.log(`   role:  ${user.role}`)
  console.log(`   setor: ${user.setor}`)
  console.log(`   senha: ${user.passwordHash ? 'hash presente' : '⚠️  NULL'}`)

  if (!user.passwordHash) {
    console.log('\n⚠️  passwordHash é NULL — conta sem senha definida.\n')
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (valid) {
    console.log(`\n✅ Senha "${password}" está CORRETA — login deveria funcionar.\n`)
    console.log('   Verifique se a API está rodando: http://localhost:3001/api/health\n')
  } else {
    console.log(`\n❌ Senha "${password}" está INCORRETA — o hash não bate.\n`)
    console.log('   → A senha foi cadastrada com outro valor.\n')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
