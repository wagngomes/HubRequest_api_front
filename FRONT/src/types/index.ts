// ── Enums (sem Prisma — definidos aqui para uso no frontend) ──
export type Role = "ADMIN" | "USER"
export type Setor = "PLANEJAMENTO" | "COMERCIAL" | "OPERACOES" | "OUTRO"
export type Sn = "S" | "N"
export type StatusSolicitacao = "PENDENTE" | "PROCESSADA"
export type StatusItem = "PENDENTE" | "PROCESSADA" | "NAO_PROCESSADA"
export type Sistema = "MONEY" | "SALESFORCE" | "MONEY_SALESFORCE"
export type Acao = "HABILITAR" | "DESABILITAR"
export type Retorno = "APROVADA" | "REPROVADA"

// Retrocompat
export type Status = StatusSolicitacao

// ── Entidades base ──
export interface User {
  id: string
  nome: string
  name: string
  email: string
  role: Role
  setor: Setor
  createdAt: string
  updatedAt: string
}

export interface Marca {
  id: string
  marca: string
  supridor: string
  emailSupridor: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  codigo: string
  descricao: string
  marca: string
  refrigerado: Sn
  controlado: Sn
  cmv: number
  tributacao: string
  multiplo: number
}

export interface CentroDistribuicao {
  id: string
  codigo: string
  label: string
}

export interface Sla {
  id: string
  origem: string
  siglaOrigem: string
  destino: string
  siglaDestino: string
  sla: number
  liberado: Sn
}

export interface Constantes {
  minimoTransferencia: number
  minimoPitagoras: number
}

// ── Transferências ──
export interface Transferencia {
  id: string
  solicitacaoId: string
  codigo: string
  descricao: string
  controlado: Sn
  refrigerado: Sn
  origem: string
  destino: string
  quantidade: number
  status: StatusItem
  dataPrevisaoChegada?: string | null
  notaFiscal?: string | null
  supridorSnapshot?: string | null
  obs: string
  createdAt: string
  updatedAt: string
}

export interface SolicitacaoTransferencia {
  id: string
  status: StatusSolicitacao
  obs?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export type TransferenciaItemWithSolicitacao = Transferencia & {
  solicitacao: SolicitacaoTransferencia & {
    user: Pick<User, "id" | "nome" | "email" | "setor">
  }
  produto: Pick<Product, "tributacao" | "multiplo" | "cmv"> & {
    marcaObj: Pick<Marca, "supridor"> | null
  }
}

export type SolicitacaoTransferenciaWithDetails = SolicitacaoTransferencia & {
  user: Pick<User, "id" | "nome" | "email" | "setor">
  itens: Transferencia[]
  _count: { itens: number }
}

// ── Liberações ──
export interface Liberacao {
  id: string
  solicitacaoId: string
  codigo: string
  descricao: string
  contribuinte: Sn
  clienteUF: string
  centro: string
  cnpjCod: string
  grupo2: string
  quantidade: number
  valor: number
  linkPedidoCompl: string
  status: StatusItem
  createdAt: string
  updatedAt: string
}

export interface SolicitacaoLiberacao {
  id: string
  status: StatusSolicitacao
  obs?: string | null
  solicitante: string
  email: string
  grupo: string
  contrato: string
  representante: string
  moneyOuSalesforce: Sistema
  acao: Acao
  retornoPlanejamento?: Retorno | null
  userId: string
  createdAt: string
  updatedAt: string
}

export type LiberacaoItemWithSolicitacao = Liberacao & {
  solicitacao: SolicitacaoLiberacao & {
    user: Pick<User, "id" | "nome" | "email" | "setor">
  }
}

export type SolicitacaoLiberacaoWithDetails = SolicitacaoLiberacao & {
  user: Pick<User, "id" | "nome" | "email" | "setor">
  itens: Liberacao[]
  _count: { itens: number }
}

// Retrocompat
export type TransferenciaItem = Transferencia
export type LiberacaoItem = Liberacao

// ── Respostas de API ──
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

export interface TableFilters {
  search?: string
  status?: Status
  page?: number
  limit?: number
}

export interface SessionUser {
  id: string
  email: string
  name: string
  nome: string
  setor: Setor
  role: Role
}
