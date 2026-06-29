import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { isPlanejamento, getServerSession } from '@/lib/auth-server'
import type { SessionUser } from '@/types'

// Gera um token JWT-like com payload base64url (sem verificação de assinatura real)
function makeToken(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${encoded}.signature`
}

function mockCookieWith(value: string | undefined) {
  ;(cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
    get: (name: string) =>
      name === 'hub_token' && value !== undefined ? { value } : undefined,
  })
}

describe('isPlanejamento', () => {
  it('retorna true para setor PLANEJAMENTO', () => {
    expect(isPlanejamento({ setor: 'PLANEJAMENTO' } as SessionUser)).toBe(true)
  })

  it('retorna false para COMERCIAL', () => {
    expect(isPlanejamento({ setor: 'COMERCIAL' } as SessionUser)).toBe(false)
  })

  it('retorna false para OPERACOES', () => {
    expect(isPlanejamento({ setor: 'OPERACOES' } as SessionUser)).toBe(false)
  })
})

describe('getServerSession', () => {
  beforeEach(() => {
    vi.mocked(cookies).mockReset()
  })

  it('retorna null quando não há cookie', async () => {
    mockCookieWith(undefined)
    expect(await getServerSession()).toBeNull()
  })

  it('retorna null para token malformado (menos de 3 partes)', async () => {
    mockCookieWith('invalido.apenas')
    expect(await getServerSession()).toBeNull()
  })

  it('retorna null para token com payload não-JSON', async () => {
    mockCookieWith('h.nao-e-base64url-valido!.s')
    expect(await getServerSession()).toBeNull()
  })

  it('retorna null para token expirado', async () => {
    const payload = {
      id: 'u-1', email: 'x@x.com', nome: 'X', name: 'X',
      role: 'USER', setor: 'COMERCIAL',
      exp: Math.floor(Date.now() / 1000) - 60, // expirou 1 minuto atrás
    }
    mockCookieWith(makeToken(payload))
    expect(await getServerSession()).toBeNull()
  })

  it('retorna SessionUser para token válido', async () => {
    const payload = {
      id: 'u-1', email: 'user@test.com', nome: 'Wagner', name: 'Wagner',
      role: 'ADMIN', setor: 'PLANEJAMENTO',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
    mockCookieWith(makeToken(payload))

    const session = await getServerSession()
    expect(session).not.toBeNull()
    expect(session!.id).toBe('u-1')
    expect(session!.email).toBe('user@test.com')
    expect(session!.role).toBe('ADMIN')
    expect(session!.setor).toBe('PLANEJAMENTO')
  })

  it('aceita token sem exp (sem prazo de validade)', async () => {
    const payload = {
      id: 'u-2', email: 'b@b.com', nome: 'B', name: 'B',
      role: 'USER', setor: 'OUTRO',
      // sem campo exp
    }
    mockCookieWith(makeToken(payload))
    const session = await getServerSession()
    expect(session).not.toBeNull()
    expect(session!.setor).toBe('OUTRO')
  })
})
