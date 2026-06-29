import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('../lib/prisma.js', async () => {
  const { prismaMock } = await import('./prisma-mock.js')
  return { prisma: prismaMock }
})

import {
  buildTestApp, makeToken, bearerOf, resetMocks, prismaMock, type TestApp,
} from './helpers.js'

describe('dados-mestres', () => {
  let app: TestApp
  let token: string

  beforeAll(async () => {
    app   = await buildTestApp()
    token = await makeToken()
  })
  afterAll(async () => { await app.close() })
  beforeEach(resetMocks)

  it('GET /centros → 200', async () => {
    prismaMock.centroDistribuicao.findMany.mockResolvedValue([])
    const res = await app.inject({ method: 'GET', url: '/api/v1/centros', headers: bearerOf(token) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /slas → 200', async () => {
    prismaMock.sla.findMany.mockResolvedValue([])
    const res = await app.inject({ method: 'GET', url: '/api/v1/slas', headers: bearerOf(token) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /restricoes → 200', async () => {
    prismaMock.restricaoTribTransf.findMany.mockResolvedValue([])
    const res = await app.inject({ method: 'GET', url: '/api/v1/restricoes', headers: bearerOf(token) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /constantes → 200', async () => {
    prismaMock.constantes.findUnique.mockResolvedValue(null)
    const res = await app.inject({ method: 'GET', url: '/api/v1/constantes', headers: bearerOf(token) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /produtos/:codigo — produto encontrado → 200', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'p1', codigo: 'P001', descricao: 'Prod', tributacao: 'N', multiplo: 1, cmv: 10,
      marcaObj: { id: 'm1', nome: 'Marca', supridor: 'SUP' },
    } as any)

    const res = await app.inject({ method: 'GET', url: '/api/v1/produtos/P001', headers: bearerOf(token) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /produtos/:codigo — produto não encontrado → 404', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)
    const res = await app.inject({ method: 'GET', url: '/api/v1/produtos/XXX', headers: bearerOf(token) })
    expect(res.statusCode).toBe(404)
  })
})
