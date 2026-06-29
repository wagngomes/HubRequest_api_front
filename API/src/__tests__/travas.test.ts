import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('../lib/prisma.js', async () => {
  const { prismaMock } = await import('./prisma-mock.js')
  return { prisma: prismaMock }
})

import {
  buildTestApp, makeToken, bearerOf, resetMocks, prismaMock,
  travaFixture, userFixture, type TestApp,
} from './helpers.js'

describe('travas', () => {
  let app: TestApp
  let userToken:   string
  let adminToken:  string
  let editorToken: string // user autorizado via travasEditores

  beforeAll(async () => {
    app         = await buildTestApp()
    userToken   = await makeToken({ email: 'user@test.com' })
    adminToken  = await makeToken({ role: 'ADMIN' })
    editorToken = await makeToken({ email: 'editor@test.com' })
  })
  afterAll(async () => { await app.close() })
  beforeEach(resetMocks)

  // ── Teste canônico de requireTravaEditor — não repetir em outros arquivos ─

  it('403 — usuário não autorizado a escrever travas', async () => {
    // Nenhum editor cadastrado → usuário comum não pode criar
    prismaMock.appConfig.findUnique.mockResolvedValue({ key: 'travasEditores', value: '' } as any)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/travas',
      headers: bearerOf(userToken),
      payload: { trava: 'ZT001', area: 'COMERCIAL' },
    })
    expect(res.statusCode).toBe(403)
  })

  // ── Leitura — qualquer autenticado ─────────────────────────────────────────

  it('GET / → 200', async () => {
    prismaMock.trava.findMany.mockResolvedValue([])
    prismaMock.trava.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/api/v1/travas', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /areas → 200', async () => {
    ;(prismaMock.trava.groupBy as any).mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/api/v1/travas/areas', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /:id → 200', async () => {
    prismaMock.trava.findUnique.mockResolvedValue(travaFixture as any)

    const res = await app.inject({ method: 'GET', url: '/api/v1/travas/t-1', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(200)
  })

  it('GET /:id — não encontrada → 404', async () => {
    prismaMock.trava.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/api/v1/travas/nao-existe', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(404)
  })

  it('GET /:id/mensagens → 200', async () => {
    // listTravaMensagensService verifica se a trava existe antes de listar
    prismaMock.trava.findUnique.mockResolvedValue(travaFixture as any)
    prismaMock.travaMensagem.findMany.mockResolvedValue([])

    const res = await app.inject({
      method: 'GET', url: '/api/v1/travas/t-1/mensagens',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /:id/mensagens → 201', async () => {
    // createTravaMensagemService verifica se a trava existe antes de criar
    prismaMock.trava.findUnique.mockResolvedValue(travaFixture as any)
    prismaMock.travaMensagem.create.mockResolvedValue({
      id: 'msg-1', travaId: 't-1', userId: 'u-test', texto: 'Oi',
      createdAt: new Date(),
      user: { ...userFixture },
    } as any)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/travas/t-1/mensagens',
      headers: bearerOf(userToken),
      payload: { texto: 'Oi' },
    })
    expect(res.statusCode).toBe(201)
  })

  // ── Escrita — admin ou editor autorizado ──────────────────────────────────

  it('POST / — ADMIN → 201', async () => {
    prismaMock.trava.create.mockResolvedValue(travaFixture as any)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/travas',
      headers: bearerOf(adminToken),
      payload: { trava: 'ZT001', area: 'COMERCIAL' },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST / — editor autorizado → 201', async () => {
    // appConfig retorna editor@test.com como autorizado
    prismaMock.appConfig.findUnique.mockResolvedValue({ key: 'travasEditores', value: 'editor@test.com' } as any)
    prismaMock.trava.create.mockResolvedValue(travaFixture as any)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/travas',
      headers: bearerOf(editorToken),
      payload: { trava: 'ZT001', area: 'COMERCIAL' },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST / — body inválido (sem trava) → 422', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/travas',
      headers: bearerOf(adminToken),
      payload: { area: 'COMERCIAL' },
    })
    expect(res.statusCode).toBe(422)
  })

  it('PATCH /:id — ADMIN → 200', async () => {
    prismaMock.trava.findUnique.mockResolvedValue(travaFixture as any)
    prismaMock.trava.update.mockResolvedValue(travaFixture as any)

    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/travas/t-1',
      headers: bearerOf(adminToken),
      payload: { status: 'INATIVA' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('DELETE /:id — ADMIN → 200', async () => {
    prismaMock.trava.findUnique.mockResolvedValue(travaFixture as any)
    prismaMock.trava.delete.mockResolvedValue(travaFixture as any)

    const res = await app.inject({
      method: 'DELETE', url: '/api/v1/travas/t-1',
      headers: bearerOf(adminToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /upload — ADMIN com CSV válido → 200', async () => {
    prismaMock.trava.upsert.mockResolvedValue(travaFixture as any)

    const boundary = 'testboundary123'
    const csv = 'trava,area,status\nZT001,COMERCIAL,ATIVA'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="travas.csv"',
      'Content-Type: text/csv',
      '',
      csv,
      `--${boundary}--`,
    ].join('\r\n')

    const res = await app.inject({
      method: 'POST', url: '/api/v1/travas/upload',
      headers: { ...bearerOf(adminToken), 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    })
    expect(res.statusCode).toBe(200)
  })
})
