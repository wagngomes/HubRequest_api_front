import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose'
import type { Role, Setor } from '@prisma/client'

export interface TokenPayload {
  id: string
  email: string
  name: string
  role: Role
  setor: Setor
}

const getLocalSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'change-me-in-production-min-32-chars'
  )

export async function signLocalToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? '8h')
    .sign(getLocalSecret())
}

export async function verifyLocalToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getLocalSecret())
  return payload as unknown as TokenPayload
}

export async function verifyOidcToken(token: string): Promise<Record<string, unknown>> {
  const jwksUri = process.env.OIDC_JWKS_URI
  if (!jwksUri) throw new Error('OIDC_JWKS_URI não configurado')

  const JWKS = createRemoteJWKSet(new URL(jwksUri))
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: process.env.OIDC_ISSUER,
    audience: process.env.OIDC_AUDIENCE,
  })
  return payload as Record<string, unknown>
}
