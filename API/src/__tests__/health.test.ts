import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildTestApp, type TestApp } from './helpers.js'

describe('GET /api/health', () => {
  let app: TestApp

  beforeAll(async () => { app = await buildTestApp() })
  afterAll(async () => { await app.close() })

  it('returns 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
  })
})
