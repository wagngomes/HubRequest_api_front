import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('../lib/prisma.js', async () => {
  const { prismaMock } = await import('./prisma-mock.js')
  return { prisma: prismaMock }
})
vi.mock('../lib/email/send.js', () => ({
  sendNovaSolicitacaoEmail:       vi.fn().mockResolvedValue(undefined),
  sendConfirmacaoSolicitacaoEmail: vi.fn().mockResolvedValue(undefined),
  sendStatusAtualizadoEmail:      vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../lib/metrics.js', () => ({
  solicitacoesTotal:   { inc: vi.fn() },
  httpRequestsTotal:   { inc: vi.fn() },
  httpRequestDuration: { observe: vi.fn() },
}))

import {
  buildTestApp, makeToken, bearerOf, resetMocks, prismaMock, type TestApp,
} from './helpers.js'

// Prisma model "Transferencia" corresponde a um item individual da transferência
const ITEM = {
  id: 'ti-1', solicitacaoId: 'TR-001', codigo: 'P001', descricao: 'Prod',
  origem: 'CD1', destino: 'CD2', quantidade: 10, status: 'PENDENTE',
  tributacao: 'N', refrigerado: 'N', controlado: 'N',
  notaFiscal: null, obs: null, dataPrevisaoChegada: null,
  createdAt: new Date(), updatedAt: new Date(),
  solicitacao: {
    id: 'TR-001', userId: 'u-test', obs: '', status: 'PENDENTE',
    createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'u-test', nome: 'Test', email: 'user@test.com', setor: 'COMERCIAL' },
  },
}

const SOL = {
  id: 'TR-001', obs: '', userId: 'u-test', status: 'PENDENTE',
  createdAt: new Date(), updatedAt: new Date(),
  itens: [{ ...ITEM, solicitacao: undefined }],
  user: { id: 'u-test', nome: 'Test', name: 'Test', email: 'user@test.com', setor: 'COMERCIAL' },
  _count: { itens: 1 },
}

describe('transferencias', () => {
  let app: TestApp
  let userToken: string
  let planToken: string

  beforeAll(async () => {
    app       = await buildTestApp()
    userToken = await makeToken({ id: 'u-test', setor: 'COMERCIAL' })
    planToken = await makeToken({ setor: 'PLANEJAMENTO' })
  })
  afterAll(async () => { await app.close() })
  beforeEach(resetMocks)

  // ── Teste canônico de requireSetor — não repetir em outros arquivos ────────

  it('403 — setor sem permissão (PATCH /:id)', async () => {
    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/transferencias/tr-1',
      headers: bearerOf(userToken), payload: { status: 'PROCESSADA' },
    })
    expect(res.statusCode).toBe(403)
  })

  // ── Happy paths ───────────────────────────────────────────────────────────

  it('GET / → 200', async () => {
    prismaMock.transferencia.findMany.mockResolvedValue([])
    prismaMock.transferencia.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/api/v1/transferencias', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(200)
  })

  it('POST / → 201', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'p1', codigo: 'P001', descricao: 'Prod', tributacao: 'N', multiplo: 1, cmv: 10 } as any,
    ])
    prismaMock.solicitacaoTransferencia.findUnique.mockResolvedValue(null)
    prismaMock.solicitacaoTransferencia.create.mockResolvedValue(SOL as any)
    prismaMock.sla.findMany.mockResolvedValue([])
    prismaMock.transferencia.update.mockResolvedValue({} as any)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/transferencias',
      headers: bearerOf(userToken),
      payload: {
        itens: [{
          codigo: 'P001', descricao: 'Prod', controlado: 'N', refrigerado: 'N',
          origem: 'CD1', destino: 'CD2', quantidade: 10,
        }],
      },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST / — body inválido → 422', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/transferencias',
      headers: bearerOf(userToken),
      payload: {},
    })
    expect(res.statusCode).toBe(422)
  })

  it('GET /export — PLANEJAMENTO → 200', async () => {
    // exportTransferenciasService chama prisma.transferencia.findMany
    prismaMock.transferencia.findMany.mockResolvedValue([])

    const res = await app.inject({
      method: 'GET', url: '/api/v1/transferencias/export',
      headers: bearerOf(planToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('GET /item/:itemId → 200', async () => {
    // getTransferenciaItemService usa prisma.transferencia.findUnique
    prismaMock.transferencia.findUnique.mockResolvedValue(ITEM as any)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/transferencias/item/ti-1',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('PATCH /item/:itemId — PLANEJAMENTO → 200', async () => {
    prismaMock.transferencia.findUnique.mockResolvedValue(ITEM as any)
    prismaMock.transferencia.update.mockResolvedValue(ITEM as any)

    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/transferencias/item/ti-1',
      headers: bearerOf(planToken),
      // PENDENTE não exige notaFiscal; PROCESSADA exigiria (superRefine)
      payload: { status: 'PENDENTE' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('GET /:id → 200', async () => {
    prismaMock.solicitacaoTransferencia.findUnique.mockResolvedValue(SOL as any)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/transferencias/tr-1',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('PATCH /:id — PLANEJAMENTO → 200', async () => {
    prismaMock.solicitacaoTransferencia.findUnique.mockResolvedValue(SOL as any)
    prismaMock.solicitacaoTransferencia.update.mockResolvedValue(SOL as any)

    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/transferencias/tr-1',
      headers: bearerOf(planToken),
      payload: { status: 'PROCESSADA' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('DELETE /:id → 200', async () => {
    // deleteTransferenciaService: usuário só pode deletar a própria solicitação
    prismaMock.solicitacaoTransferencia.findUnique.mockResolvedValue(SOL as any)
    prismaMock.solicitacaoTransferencia.delete.mockResolvedValue(SOL as any)

    const res = await app.inject({
      method: 'DELETE', url: '/api/v1/transferencias/tr-1',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })
})
