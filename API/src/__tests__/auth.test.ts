import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

vi.mock('../lib/prisma.js', async () => {
  const { prismaMock } = await import('./prisma-mock.js')
  return { prisma: prismaMock }
})

import {
  buildTestApp, makeToken, bearerOf, resetMocks, prismaMock,
  userFixture, type TestApp,
} from './helpers.js'

describe('auth', () => {
  let app: TestApp

  beforeAll(async () => { app = await buildTestApp() })
  afterAll(async () => { await app.close() })
  beforeEach(resetMocks)

  // ── Teste canônico de autenticação — todos os outros arquivos não repetem ──

  it('401 — sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' })
    expect(res.statusCode).toBe(401)
  })

  it('401 — token inválido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer token_invalido' },
    })
    expect(res.statusCode).toBe(401)
  })

  // ── Login ──────────────────────────────────────────────────────────────────

  it('POST /login — credenciais válidas → 200 com token', async () => {
    const hash = await bcrypt.hash('senha123', 4)
    prismaMock.user.findUnique.mockResolvedValue({ ...userFixture, passwordHash: hash } as any)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'user@test.com', password: 'senha123' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('token')
  })

  it('POST /login — senha errada → 401', async () => {
    const hash = await bcrypt.hash('outrasenha', 4)
    prismaMock.user.findUnique.mockResolvedValue({ ...userFixture, passwordHash: hash } as any)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'user@test.com', password: 'errada' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('POST /login — body inválido (sem email) → 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { password: 'senha123' },
    })
    expect(res.statusCode).toBe(422)
  })

  // ── Me ─────────────────────────────────────────────────────────────────────

  it('GET /me — token válido → 200 com dados do usuário', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userFixture as any)
    const token = await makeToken()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: bearerOf(token),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('email', 'user@test.com')
  })

  // ── Logout ─────────────────────────────────────────────────────────────────

  it('POST /logout → 200', async () => {
    const token = await makeToken()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: bearerOf(token),
    })
    expect(res.statusCode).toBe(200)
  })

  // ── Register ───────────────────────────────────────────────────────────────

  it('POST /register — novo usuário → 201', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(userFixture as any)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { nome: 'Test User', email: 'new@test.com', password: 'senha123', setor: 'COMERCIAL' },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST /register — e-mail duplicado → 409', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userFixture as any)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { nome: 'Test User', email: 'user@test.com', password: 'senha123', setor: 'COMERCIAL' },
    })
    expect(res.statusCode).toBe(409)
  })
})
