import type {
  Role,
  Setor,
  Sn,
  StatusSolicitacao,
  StatusItem,
  Sistema,
  Acao,
  Retorno,
  User,
  Product,
  Marca,
  Sla,
  CentroDistribuicao,
  Constantes,
  AppConfig,
  SolicitacaoTransferencia,
  Transferencia,
  SolicitacaoLiberacao,
  Liberacao,
} from '@prisma/client'

export type {
  Role,
  Setor,
  Sn,
  StatusSolicitacao,
  StatusItem,
  Sistema,
  Acao,
  Retorno,
  User,
  Product,
  Marca,
  Sla,
  CentroDistribuicao,
  Constantes,
  AppConfig,
  SolicitacaoTransferencia,
  Transferencia,
  SolicitacaoLiberacao,
  Liberacao,
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SessionUser {
  id: string
  email: string
  name: string
  nome: string
  role: Role
  setor: Setor
}

export type TransferenciaItemWithSolicitacao = Transferencia & {
  solicitacao: SolicitacaoTransferencia & {
    user: Pick<User, 'id' | 'nome' | 'email' | 'setor'>
  }
  produto: Pick<Product, 'tributacao' | 'multiplo' | 'cmv'> & {
    marcaObj: Pick<Marca, 'supridor'> | null
  }
}

export type LiberacaoItemWithSolicitacao = Liberacao & {
  solicitacao: SolicitacaoLiberacao & {
    user: Pick<User, 'id' | 'nome' | 'email' | 'setor'>
  }
}

export type SolicitacaoTransferenciaWithDetails = SolicitacaoTransferencia & {
  user: Pick<User, 'id' | 'nome' | 'email' | 'setor'>
  itens: Transferencia[]
  _count: { itens: number }
}

export type SolicitacaoLiberacaoWithDetails = SolicitacaoLiberacao & {
  user: Pick<User, 'id' | 'nome' | 'email' | 'setor'>
  itens: Liberacao[]
  _count: { itens: number }
}
