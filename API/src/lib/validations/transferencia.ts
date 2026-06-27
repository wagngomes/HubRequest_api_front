import { z } from 'zod'

export const transferenciaItemSchema = z.object({
  codigo: z.string().min(1, 'Código do produto obrigatório'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  controlado: z.enum(['S', 'N'], { required_error: 'Campo obrigatório' }),
  refrigerado: z.enum(['S', 'N'], { required_error: 'Campo obrigatório' }),
  origem: z.string().min(1, 'Origem obrigatória'),
  destino: z.string().min(1, 'Destino obrigatório'),
  quantidade: z.coerce
    .number({ invalid_type_error: 'Quantidade inválida' })
    .int('Quantidade deve ser inteiro')
    .positive('Quantidade deve ser positiva'),
})

export const solicitacaoTransferenciaSchema = z.object({
  obs: z.string().optional(),
  itens: z
    .array(transferenciaItemSchema)
    .min(1, 'Adicione pelo menos um item')
    .max(20, 'Máximo de 20 itens por solicitação'),
})

export const transferenciaStatusSchema = z.object({
  status: z.enum(['PENDENTE', 'PROCESSADA']),
  obs: z.string().optional(),
})

export const transferenciaItemStatusSchema = z
  .object({
    status: z.enum(['PENDENTE', 'PROCESSADA', 'NAO_PROCESSADA']),
    notaFiscal: z.string().optional(),
    obs: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'PROCESSADA' && (!data.notaFiscal || data.notaFiscal.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notaFiscal'],
        message: 'Nota Fiscal é obrigatória ao marcar como Processada',
      })
    }
  })

export type TransferenciaItemInput = z.infer<typeof transferenciaItemSchema>
export type SolicitacaoTransferenciaInput = z.infer<typeof solicitacaoTransferenciaSchema>
export type TransferenciaStatusInput = z.infer<typeof transferenciaStatusSchema>
export type TransferenciaItemStatusInput = z.infer<typeof transferenciaItemStatusSchema>
