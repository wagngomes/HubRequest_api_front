import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('../lib/prisma.js', async () => {
  const { prismaMock } = await import('./prisma-mock.js')
  return { prisma: prismaMock }
})

import {
  buildTestApp, makeToken, bearerOf, resetMocks, prismaMock, type TestApp,
} from './helpers.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const USER_ROW = { id: 'u-1', nome: 'User', name: 'User', email: 'a@b.com', setor: 'COMERCIAL', role: 'USER', createdAt: new Date() }
const MARCA_ROW = { id: 'm-1', marca: 'Marca', supridor: 'SUP', emailSupridor: '' }
const PRODUCT_ROW = { id: 'p-1', codigo: 'P001', descricao: 'Prod', tributacao: 'N', multiplo: 1, cmv: 10, refrigerado: 'N', controlado: 'N', marca: 'Marca' }
const SLA_ROW = { id: 's-1', origem: 'CD1', siglaOrigem: 'O1', destino: 'CD2', siglaDestino: 'D1', sla: 24, liberado: 'S' }
const REST_ROW = { id: 'r-1', tributacao: 'N', origem: 'CD1', destino: 'CD2' }
const CENTRO_ROW = { id: 'c-1', codigo: 'CD1', label: 'Centro 1' }
const CONSTANTES_ROW = { id: 'singleton', minimoTransferencia: 0, minimoPitagoras: 0 }

// Multipart helper
function makeMultipart(boundary: string, filename: string, csvContent: string): string {
  return [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    'Content-Type: text/csv',
    '',
    csvContent,
    `--${boundary}--`,
  ].join('\r\n')
}

describe('admin', () => {
  let app: TestApp
  let adminToken: string
  let userToken:  string

  beforeAll(async () => {
    app        = await buildTestApp()
    adminToken = await makeToken({ role: 'ADMIN', setor: 'PLANEJAMENTO' })
    userToken  = await makeToken({ role: 'USER' })
  })
  afterAll(async () => { await app.close() })
  beforeEach(resetMocks)

  // ── Teste canônico de requireRole(ADMIN) — não repetir em outros arquivos ──

  it('403 — perfil sem permissão de admin', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(403)
  })

  // ── Users ─────────────────────────────────────────────────────────────────

  describe('users', () => {
    it('GET / → 200', async () => {
      prismaMock.user.findMany.mockResolvedValue([USER_ROW] as any)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('POST / → 201', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.create.mockResolvedValue(USER_ROW as any)

      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/users',
        headers: bearerOf(adminToken),
        payload: { nome: 'User', email: 'new@test.com', password: 'senha123', setor: 'COMERCIAL', role: 'USER' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('PATCH /:id → 200', async () => {
      prismaMock.user.findUnique.mockResolvedValue(USER_ROW as any)
      prismaMock.user.update.mockResolvedValue(USER_ROW as any)

      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/users/u-1',
        headers: bearerOf(adminToken),
        payload: { nome: 'Updated' },
      })
      expect(res.statusCode).toBe(200)
    })

    it('DELETE /:id → 200', async () => {
      prismaMock.user.findUnique.mockResolvedValue(USER_ROW as any)
      prismaMock.user.delete.mockResolvedValue(USER_ROW as any)

      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/admin/users/u-1',
        headers: bearerOf(adminToken),
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── Marcas ────────────────────────────────────────────────────────────────

  describe('marcas', () => {
    it('GET / → 200', async () => {
      prismaMock.marca.findMany.mockResolvedValue([MARCA_ROW] as any)
      prismaMock.marca.count.mockResolvedValue(1)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/marcas', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('POST / → 201', async () => {
      prismaMock.marca.findUnique.mockResolvedValue(null)
      prismaMock.marca.create.mockResolvedValue(MARCA_ROW as any)

      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/marcas',
        headers: bearerOf(adminToken),
        payload: { marca: 'Marca', supridor: 'SUP', emailSupridor: '' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('POST /upload → 200', async () => {
      prismaMock.marca.upsert.mockResolvedValue(MARCA_ROW as any)

      const boundary = 'mb1'
      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/marcas/upload',
        headers: { ...bearerOf(adminToken), 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload: makeMultipart(boundary, 'marcas.csv', 'marca,supridor\nMarca,SUP'),
      })
      expect(res.statusCode).toBe(200)
    })

    it('PATCH /:id → 200', async () => {
      prismaMock.marca.findUnique.mockResolvedValue(MARCA_ROW as any)
      prismaMock.marca.update.mockResolvedValue(MARCA_ROW as any)

      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/marcas/m-1',
        headers: bearerOf(adminToken),
        payload: { supridor: 'SUP2' },
      })
      expect(res.statusCode).toBe(200)
    })

    it('DELETE /:id → 200', async () => {
      prismaMock.marca.findUnique.mockResolvedValue(MARCA_ROW as any)
      prismaMock.marca.delete.mockResolvedValue(MARCA_ROW as any)

      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/admin/marcas/m-1',
        headers: bearerOf(adminToken),
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── Products ──────────────────────────────────────────────────────────────

  describe('products', () => {
    it('GET / → 200', async () => {
      prismaMock.product.findMany.mockResolvedValue([PRODUCT_ROW] as any)
      prismaMock.product.count.mockResolvedValue(1)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/products', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('POST /upload → 200', async () => {
      prismaMock.marca.findUnique.mockResolvedValue(MARCA_ROW as any)
      prismaMock.product.upsert.mockResolvedValue(PRODUCT_ROW as any)

      const boundary = 'pb1'
      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/products/upload',
        headers: { ...bearerOf(adminToken), 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload: makeMultipart(boundary, 'products.csv', 'codigo,descricao,marca,refrigerado,controlado,cmv,tributacao,multiplo\nP001,Prod,Marca,N,N,10,N,1'),
      })
      expect(res.statusCode).toBe(200)
    })

    it('PATCH /:id → 200', async () => {
      prismaMock.product.findUnique.mockResolvedValue(PRODUCT_ROW as any)
      prismaMock.marca.findUnique.mockResolvedValue(MARCA_ROW as any)
      prismaMock.product.update.mockResolvedValue(PRODUCT_ROW as any)

      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/products/p-1',
        headers: bearerOf(adminToken),
        payload: { cmv: 20 },
      })
      expect(res.statusCode).toBe(200)
    })

    it('DELETE /:id → 200', async () => {
      prismaMock.product.findUnique.mockResolvedValue(PRODUCT_ROW as any)
      prismaMock.product.delete.mockResolvedValue(PRODUCT_ROW as any)

      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/admin/products/p-1',
        headers: bearerOf(adminToken),
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── SLAs ──────────────────────────────────────────────────────────────────

  describe('slas', () => {
    it('GET / → 200', async () => {
      prismaMock.sla.findMany.mockResolvedValue([SLA_ROW] as any)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/slas', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('POST / → 201', async () => {
      prismaMock.sla.create.mockResolvedValue(SLA_ROW as any)
      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/slas',
        headers: bearerOf(adminToken),
        payload: { origem: 'CD1', siglaOrigem: 'O1', destino: 'CD2', siglaDestino: 'D1', sla: 24, liberado: 'S' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('POST /upload → 200', async () => {
      prismaMock.sla.upsert.mockResolvedValue(SLA_ROW as any)

      const boundary = 'sb1'
      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/slas/upload',
        headers: { ...bearerOf(adminToken), 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload: makeMultipart(boundary, 'slas.csv', 'origem,siglaorigem,destino,sigladestino,sla,liberado\nCD1,O1,CD2,D1,24,S'),
      })
      expect(res.statusCode).toBe(200)
    })

    it('PATCH /:id → 200', async () => {
      prismaMock.sla.findUnique.mockResolvedValue(SLA_ROW as any)
      prismaMock.sla.update.mockResolvedValue(SLA_ROW as any)

      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/slas/s-1',
        headers: bearerOf(adminToken),
        payload: { sla: 48 },
      })
      expect(res.statusCode).toBe(200)
    })

    it('DELETE /:id → 200', async () => {
      prismaMock.sla.findUnique.mockResolvedValue(SLA_ROW as any)
      prismaMock.sla.delete.mockResolvedValue(SLA_ROW as any)

      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/admin/slas/s-1',
        headers: bearerOf(adminToken),
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── Restrições ────────────────────────────────────────────────────────────

  describe('restricoes', () => {
    it('GET / → 200', async () => {
      prismaMock.restricaoTribTransf.findMany.mockResolvedValue([REST_ROW] as any)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/restricoes', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('POST / → 201', async () => {
      prismaMock.restricaoTribTransf.create.mockResolvedValue(REST_ROW as any)
      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/restricoes',
        headers: bearerOf(adminToken),
        payload: { tributacao: 'N', origem: 'CD1', destino: 'CD2' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('DELETE /:id → 200', async () => {
      prismaMock.restricaoTribTransf.findUnique.mockResolvedValue(REST_ROW as any)
      prismaMock.restricaoTribTransf.delete.mockResolvedValue(REST_ROW as any)

      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/admin/restricoes/r-1',
        headers: bearerOf(adminToken),
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── Centros ───────────────────────────────────────────────────────────────

  describe('centros', () => {
    it('GET / → 200', async () => {
      prismaMock.centroDistribuicao.findMany.mockResolvedValue([CENTRO_ROW] as any)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/centros', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('POST / → 201', async () => {
      prismaMock.centroDistribuicao.findUnique.mockResolvedValue(null)
      prismaMock.centroDistribuicao.create.mockResolvedValue(CENTRO_ROW as any)

      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/centros',
        headers: bearerOf(adminToken),
        payload: { codigo: 'CD1', label: 'Centro 1' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('POST /upload → 200', async () => {
      prismaMock.centroDistribuicao.upsert.mockResolvedValue(CENTRO_ROW as any)

      const boundary = 'cb1'
      const res = await app.inject({
        method: 'POST', url: '/api/v1/admin/centros/upload',
        headers: { ...bearerOf(adminToken), 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload: makeMultipart(boundary, 'centros.csv', 'codigo,label\nCD1,Centro 1'),
      })
      expect(res.statusCode).toBe(200)
    })

    it('PATCH /:id → 200', async () => {
      prismaMock.centroDistribuicao.findUnique.mockResolvedValue(CENTRO_ROW as any)
      prismaMock.centroDistribuicao.update.mockResolvedValue(CENTRO_ROW as any)

      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/centros/c-1',
        headers: bearerOf(adminToken),
        payload: { label: 'Centro Atualizado' },
      })
      expect(res.statusCode).toBe(200)
    })

    it('DELETE /:id → 200', async () => {
      prismaMock.centroDistribuicao.findUnique.mockResolvedValue(CENTRO_ROW as any)
      prismaMock.centroDistribuicao.delete.mockResolvedValue(CENTRO_ROW as any)

      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/admin/centros/c-1',
        headers: bearerOf(adminToken),
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── Constantes ────────────────────────────────────────────────────────────

  describe('constantes', () => {
    it('GET / → 200', async () => {
      prismaMock.constantes.findUnique.mockResolvedValue(CONSTANTES_ROW as any)
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/constantes', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('PATCH / → 200', async () => {
      prismaMock.constantes.upsert.mockResolvedValue(CONSTANTES_ROW as any)
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/constantes',
        headers: bearerOf(adminToken),
        payload: { minimoTransferencia: 100, minimoPitagoras: 50 },
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ── Settings ──────────────────────────────────────────────────────────────

  describe('settings', () => {
    it('GET / → 200', async () => {
      prismaMock.appConfig.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/settings', headers: bearerOf(adminToken) })
      expect(res.statusCode).toBe(200)
    })

    it('PATCH / → 200', async () => {
      prismaMock.appConfig.upsert.mockResolvedValue({ key: 'notificationEmails', value: 'a@b.com' } as any)
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/admin/settings',
        headers: bearerOf(adminToken),
        payload: { notificationEmails: 'a@b.com' },
      })
      expect(res.statusCode).toBe(200)
    })
  })
})
