import { z } from 'zod'

export const liberacaoCabecalhoSchema = z.object({
  grupo: z.string().min(1, 'Grupo obrigatório'),
  contrato: z.string().min(1, 'Contrato obrigatório'),
  representante: z.string().min(1, 'Representante obrigatório'),
  moneyOuSalesforce: z.enum(['MONEY', 'SALESFORCE', 'MONEY_SALESFORCE'], {
    required_error: 'Selecione o sistema',
  }),
  acao: z.enum(['HABILITAR', 'DESABILITAR'], {
    required_error: 'Selecione a ação',
  }),
  obs: z.string().optional(),
})

export const liberacaoItemSchema = z.object({
  codigo: z.string().min(1, 'Código do produto obrigatório'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  contribuinte: z.enum(['S', 'N'], { required_error: 'Campo obrigatório' }),
  clienteUF: z.string().min(2, 'UF inválida').max(2, 'UF deve ter 2 letras'),
  centro: z.string().min(1, 'Centro obrigatório'),
  cnpjCod: z.string().min(1, 'CNPJ/Código obrigatório'),
  grupo2: z.string().min(1, 'Grupo 2 obrigatório'),
  quantidade: z.coerce
    .number({ invalid_type_error: 'Quantidade inválida' })
    .int('Deve ser inteiro')
    .positive('Deve ser positivo'),
  valor: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('Deve ser positivo'),
  linkPedidoCompl: z.string().min(1, 'Link obrigatório'),
})

export const solicitacaoLiberacaoSchema = liberacaoCabecalhoSchema.extend({
  itens: z
    .array(liberacaoItemSchema)
    .min(1, 'Adicione pelo menos um item')
    .max(20, 'Máximo de 20 itens por solicitação'),
})

export const liberacaoItemStatusSchema = z.object({
  status: z.enum(['PENDENTE', 'PROCESSADA']),
})

export const liberacaoRetornoSchema = z.object({
  retornoPlanejamento: z.enum(['APROVADA', 'REPROVADA']),
  status: z.enum(['PENDENTE', 'PROCESSADA']),
  obs: z.string().optional(),
})

export type LiberacaoCabecalhoInput = z.infer<typeof liberacaoCabecalhoSchema>
export type LiberacaoItemInput = z.infer<typeof liberacaoItemSchema>
export type SolicitacaoLiberacaoInput = z.infer<typeof solicitacaoLiberacaoSchema>
export type LiberacaoRetornoInput = z.infer<typeof liberacaoRetornoSchema>
export type LiberacaoItemStatusInput = z.infer<typeof liberacaoItemStatusSchema>
