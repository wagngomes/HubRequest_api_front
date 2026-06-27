/**
 * Cria ou promove um usuário para ADMIN.
 * Uso: npm run set-admin -- --email=admin@empresa.com --nome="Seu Nome" --password=SenhaForte123
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function arg(name: string): string | undefined {
  const flag = `--${name}=`
  return process.argv.find((a) => a.startsWith(flag))?.slice(flag.length)
}

async function main() {
  const email    = arg('email')
  const nome     = arg('nome') ?? arg('name')
  const password = arg('password')

  if (!email || !password) {
    console.error('Uso: npm run set-admin -- --email=... --password=... [--nome=...]')
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    // Usuário já existe — promove para ADMIN e atualiza senha se fornecida
    const passwordHash = await bcrypt.hash(password, 12)
    const updated = await prisma.user.update({
      where: { email },
      data:  { role: 'ADMIN', passwordHash },
      select: { id: true, nome: true, email: true, role: true },
    })
    console.log('✅ Usuário promovido para ADMIN e senha atualizada:', updated)
  } else {
    // Cria novo usuário ADMIN
    if (!nome) {
      console.error('Usuário não encontrado. Informe --nome para criar um novo.')
      process.exit(1)
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const created = await prisma.user.create({
      data: { nome, name: nome, email, passwordHash, role: 'ADMIN', setor: 'PLANEJAMENTO' },
      select: { id: true, nome: true, email: true, role: true },
    })
    console.log('✅ Admin criado:', created)
  }
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
