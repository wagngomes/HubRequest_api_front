import { mockReset } from 'vitest-mock-extended'
import { buildApp } from '../app.js'
import { signLocalToken } from '../lib/auth/jwt.js'
import { prismaMock } from './prisma-mock.js'

export { prismaMock }

export type TestApp = Awaited<ReturnType<typeof buildApp>>

export async function buildTestApp(): Promise<TestApp> {
  const app = await buildApp()
  await app.ready()
  return app
}

export function resetMocks() {
  mockReset(prismaMock)
}

// ── Token factories ────────────────────────────────────────────────────────

type TokenOverrides = {
  id?: string
  email?: string
  name?: string
  role?: 'USER' | 'ADMIN'
  setor?: 'PLANEJAMENTO' | 'COMERCIAL' | 'OPERACOES' | 'OUTRO'
}

export async function makeToken(overrides: TokenOverrides = {}): Promise<string> {
  return signLocalToken({
    id:    overrides.id    ?? 'u-test',
    email: overrides.email ?? 'user@test.com',
    name:  overrides.name  ?? 'Test User',
    role:  overrides.role  ?? 'USER',
    setor: overrides.setor ?? 'COMERCIAL',
  } as Parameters<typeof signLocalToken>[0])
}

export const bearerOf = (token: string) => ({ authorization: `Bearer ${token}` })

// ── Fixtures comuns ────────────────────────────────────────────────────────

export const userFixture = {
  id:           'u-test',
  email:        'user@test.com',
  nome:         'Test User',
  name:         'Test User',
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LQ1Ei.YK1Gv8Nrwz4BxM5v6CRbGtRZ8WU3kW',
  role:         'USER',
  setor:        'COMERCIAL',
  createdAt:    new Date('2024-01-01'),
  updatedAt:    new Date('2024-01-01'),
} as const

export const adminFixture = {
  ...userFixture,
  id:    'u-admin',
  email: 'admin@test.com',
  role:  'ADMIN',
  setor: 'PLANEJAMENTO',
} as const

export const travaFixture = {
  id:                 't-1',
  trava:              'ZT001',
  nomeTrava:          'Trava Teste',
  area:               'COMERCIAL',
  status:             'ATIVA',
  solicitacao:        '',
  aprovadores:        [],
  mensagemCustomizada:'',
  motivoDetalhamento: '',
  dataSolicitacao:    '',
  transOuVenda:       'VENDA',
  salesOuMoney:       'MONEY_SALESFORCE',
  dataAtualizacao:    '',
  motivoAtualizacao:  '',
  createdAt:          new Date('2024-01-01'),
  updatedAt:          new Date('2024-01-01'),
} as const
