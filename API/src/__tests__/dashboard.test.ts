import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('../lib/prisma.js', async () => {
  const { prismaMock } = await import('./prisma-mock.js')
  return { prisma: prismaMock }
})

import {
  buildTestApp, makeToken, bearerOf, resetMocks, prismaMock, type TestApp,
} from './helpers.js'

describe('dashboard', () => {
  let app: TestApp
  let token: string

  beforeAll(async () => {
    app   = await buildTestApp()
    token = await makeToken({ setor: 'PLANEJAMENTO' })
  })
  afterAll(async () => { await app.close() })
  beforeEach(resetMocks)

  it('GET /dashboard → 200', async () => {
    prismaMock.transferencia.findMany.mockResolvedValue([])
    prismaMock.solicitacaoLiberacao.findMany.mockResolvedValue([])

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard?mes=1&ano=2024',
      headers: bearerOf(token),
    })
    expect(res.statusCode).toBe(200)
  })
})
