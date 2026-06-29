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

const USER_REF = { id: 'u-test', nome: 'Test', email: 'user@test.com', setor: 'COMERCIAL' }

// Item de liberação com solicitacao aninhada (como o Prisma retorna com include)
const LIB_ITEM = {
  id: 'li-1', solicitacaoId: 'LB-001', codigo: 'P001', descricao: 'Prod',
  contribuinte: 'N', clienteUF: 'SP', centro: 'CD1', cnpjCod: '00',
  grupo2: 'G1', quantidade: 10, valor: 100, linkPedidoCompl: 'http://x',
  status: 'PENDENTE', retorno: '', createdAt: new Date(), updatedAt: new Date(),
  solicitacao: {
    id: 'LB-001', userId: 'u-test', contrato: 'CT001', acao: 'HABILITAR',
    solicitante: 'Test', email: 'user@test.com', status: 'PENDENTE',
    createdAt: new Date(), updatedAt: new Date(),
    user: { ...USER_REF, name: 'Test' },
  },
}

const SOL_LIB = {
  id: 'LB-001', contrato: 'CT001', acao: 'HABILITAR',
  representante: 'Rep', moneyOuSalesforce: 'MONEY',
  obs: '', grupo: 'G1', solicitante: 'Test', email: 'user@test.com',
  userId: 'u-test', status: 'PENDENTE',
  createdAt: new Date(), updatedAt: new Date(),
  itens: [{ ...LIB_ITEM, solicitacao: undefined }],
  user: { ...USER_REF, name: 'Test' },
  _count: { itens: 1 },
}

describe('liberacoes', () => {
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

  it('GET / → 200', async () => {
    prismaMock.liberacao.findMany.mockResolvedValue([])
    prismaMock.liberacao.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/api/v1/liberacoes', headers: bearerOf(userToken) })
    expect(res.statusCode).toBe(200)
  })

  it('POST / → 201', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'p1', codigo: 'P001', descricao: 'Prod', tributacao: 'N', multiplo: 1, cmv: 10 } as any,
    ])
    prismaMock.solicitacaoLiberacao.findUnique.mockResolvedValue(null)
    prismaMock.solicitacaoLiberacao.create.mockResolvedValue(SOL_LIB as any)
    prismaMock.appConfig.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/liberacoes',
      headers: bearerOf(userToken),
      payload: {
        contrato: 'CT001', acao: 'HABILITAR', grupo: 'G1',
        representante: 'Rep', moneyOuSalesforce: 'MONEY', obs: '',
        itens: [{
          codigo: 'P001', descricao: 'Prod', contribuinte: 'N',
          clienteUF: 'SP', centro: 'CD1', cnpjCod: '00',
          grupo2: 'G1', quantidade: 10, valor: 100, linkPedidoCompl: 'http://x',
        }],
      },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST / — body inválido → 422', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/liberacoes',
      headers: bearerOf(userToken),
      payload: {},
    })
    expect(res.statusCode).toBe(422)
  })

  it('GET /item/:itemId → 200', async () => {
    // getLiberacaoItemService inclui solicitacao.user — mock deve ter esses campos
    prismaMock.liberacao.findUnique.mockResolvedValue(LIB_ITEM as any)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/liberacoes/item/li-1',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('PATCH /item/:itemId — PLANEJAMENTO → 200', async () => {
    // updateLiberacaoItemService acessa item.solicitacao.user.email/nome
    prismaMock.liberacao.findUnique.mockResolvedValue(LIB_ITEM as any)
    prismaMock.liberacao.update.mockResolvedValue(LIB_ITEM as any)

    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/liberacoes/item/li-1',
      headers: bearerOf(planToken),
      payload: { status: 'PROCESSADA' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('GET /:id → 200', async () => {
    prismaMock.solicitacaoLiberacao.findUnique.mockResolvedValue(SOL_LIB as any)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/liberacoes/LB-001',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })

  it('PATCH /:id — PLANEJAMENTO → 200', async () => {
    // updateLiberacaoService usa liberacaoRetornoSchema: requer retornoPlanejamento + status
    prismaMock.solicitacaoLiberacao.findUnique.mockResolvedValue(SOL_LIB as any)
    prismaMock.solicitacaoLiberacao.update.mockResolvedValue(SOL_LIB as any)

    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/liberacoes/LB-001',
      headers: bearerOf(planToken),
      payload: { retornoPlanejamento: 'APROVADA', status: 'PROCESSADA' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('DELETE /:id → 200', async () => {
    prismaMock.solicitacaoLiberacao.findUnique.mockResolvedValue(SOL_LIB as any)
    prismaMock.solicitacaoLiberacao.delete.mockResolvedValue(SOL_LIB as any)

    const res = await app.inject({
      method: 'DELETE', url: '/api/v1/liberacoes/LB-001',
      headers: bearerOf(userToken),
    })
    expect(res.statusCode).toBe(200)
  })
})
