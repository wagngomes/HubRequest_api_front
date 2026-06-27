import type { Role, Setor } from '@prisma/client'

// Quando o mapeamento corporativo chegar, preencha os dicionários abaixo.
// O resto da API não precisa mudar — só este arquivo.

const IDP_GROUP_TO_ROLE: Record<string, Role> = {
  // 'GRP-REQUESTHUB-ADMIN': 'ADMIN',
  // 'GRP-REQUESTHUB-USER':  'USER',
}

const IDP_CLAIM_TO_SETOR: Record<string, Setor> = {
  // 'Planejamento':  'PLANEJAMENTO',
  // 'Comercial':     'COMERCIAL',
  // 'Operacoes':     'OPERACOES',
}

export interface IdPClaims {
  sub: string
  email: string
  name?: string
  groups?: string[]
  roles?: string[]
  department?: string
  [key: string]: unknown
}

export interface MappedUser {
  id: string
  email: string
  name: string
  role: Role
  setor: Setor
}

export function mapClaims(claims: IdPClaims): MappedUser {
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name ?? claims.email,
    role: resolveRole(claims.groups ?? [], claims.roles ?? []),
    setor: resolveSetor(claims.department),
  }
}

function resolveRole(groups: string[], roles: string[]): Role {
  for (const g of [...groups, ...roles]) {
    if (IDP_GROUP_TO_ROLE[g]) return IDP_GROUP_TO_ROLE[g]
  }
  return 'USER'
}

function resolveSetor(department?: string): Setor {
  if (department && IDP_CLAIM_TO_SETOR[department]) {
    return IDP_CLAIM_TO_SETOR[department]
  }
  return 'OUTRO'
}
