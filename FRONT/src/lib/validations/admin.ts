import { z } from "zod"

export const adminUserCreateSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  setor: z.enum(["PLANEJAMENTO", "COMERCIAL", "OPERACOES", "OUTRO"], {
    required_error: "Selecione o setor",
  }),
  role: z.enum(["ADMIN", "USER"], { required_error: "Selecione o perfil" }),
})

export const adminUserUpdateSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
  setor: z.enum(["PLANEJAMENTO", "COMERCIAL", "OPERACOES", "OUTRO"]).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
})

export const adminProductSchema = z.object({
  codigo: z.string().min(1, "Código obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  marca: z.string().min(1, "Marca obrigatória"),
  refrigerado: z.enum(["S", "N"], { required_error: "Campo obrigatório" }),
  controlado: z.enum(["S", "N"], { required_error: "Campo obrigatório" }),
  cmv: z.coerce.number({ invalid_type_error: "CMV inválido" }).min(0, "CMV não pode ser negativo"),
  tributacao: z.string(),
  multiplo: z.coerce.number({ invalid_type_error: "Múltiplo inválido" }).int().min(1, "Mínimo 1"),
})

export const adminMarcaSchema = z.object({
  marca: z.string().min(1, "Marca obrigatória"),
  supridor: z.string(),
  emailSupridor: z.string().email("E-mail inválido").or(z.literal("")),
})

export const adminRestricaoSchema = z.object({
  tributacao: z.string().min(1, "Tributação obrigatória"),
  origem: z.string().min(1, "Origem obrigatória"),
  destino: z.string().min(1, "Destino obrigatório"),
})

export const adminCentroSchema = z.object({
  codigo: z.string().min(1, "Código obrigatório"),
  label: z.string().min(1, "Nome obrigatório"),
})

export const adminSlaSchema = z.object({
  origem: z.string().min(1, "Origem obrigatória"),
  siglaOrigem: z.string().min(1, "Sigla origem obrigatória"),
  destino: z.string().min(1, "Destino obrigatório"),
  siglaDestino: z.string().min(1, "Sigla destino obrigatória"),
  sla: z.coerce.number({ invalid_type_error: "SLA inválido" }).int().min(0, "SLA não pode ser negativo"),
  liberado: z.enum(["S", "N"], { required_error: "Campo obrigatório" }),
})

export const adminConstantesSchema = z.object({
  minimoTransferencia: z.coerce.number({ invalid_type_error: "Valor inválido" }).min(0, "Não pode ser negativo"),
  minimoPitagoras: z.coerce.number({ invalid_type_error: "Valor inválido" }).min(0, "Não pode ser negativo"),
})

export const adminSettingsSchema = z.object({
  notificationEmails: z.string().optional(),
  notificationEmailsTransferencia: z.string().optional(),
  notificationEmailsLiberacao: z.string().optional(),
})

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>
export type AdminProductInput = z.infer<typeof adminProductSchema>
export type AdminMarcaInput = z.infer<typeof adminMarcaSchema>
export type AdminRestricaoInput = z.infer<typeof adminRestricaoSchema>
export type AdminCentroInput = z.infer<typeof adminCentroSchema>
export type AdminSlaInput = z.infer<typeof adminSlaSchema>
export type AdminConstantesInput = z.infer<typeof adminConstantesSchema>
export type AdminSettingsInput = z.infer<typeof adminSettingsSchema>
