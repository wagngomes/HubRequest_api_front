import { describe, it, expect } from 'vitest'
import {
  transferenciaItemStatusSchema,
  solicitacaoTransferenciaSchema,
} from '@/lib/validations/transferencia'

const VALID_ITEM = {
  codigo: 'P001', descricao: 'Produto Teste',
  controlado: 'N' as const, refrigerado: 'N' as const,
  origem: 'CD1', destino: 'CD2', quantidade: 10,
}

// ── transferenciaItemStatusSchema (superRefine) ────────────────────────────

describe('transferenciaItemStatusSchema', () => {
  it('aceita PENDENTE sem notaFiscal', () => {
    expect(transferenciaItemStatusSchema.safeParse({ status: 'PENDENTE' }).success).toBe(true)
  })

  it('aceita NAO_PROCESSADA sem notaFiscal', () => {
    expect(transferenciaItemStatusSchema.safeParse({ status: 'NAO_PROCESSADA' }).success).toBe(true)
  })

  it('aceita PROCESSADA com notaFiscal preenchida', () => {
    expect(
      transferenciaItemStatusSchema.safeParse({ status: 'PROCESSADA', notaFiscal: 'NF-001' }).success,
    ).toBe(true)
  })

  it('rejeita PROCESSADA sem notaFiscal', () => {
    const result = transferenciaItemStatusSchema.safeParse({ status: 'PROCESSADA' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('notaFiscal')
    }
  })

  it('rejeita PROCESSADA com notaFiscal em branco', () => {
    const result = transferenciaItemStatusSchema.safeParse({ status: 'PROCESSADA', notaFiscal: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejeita status inválido', () => {
    expect(transferenciaItemStatusSchema.safeParse({ status: 'INVALIDO' }).success).toBe(false)
  })
})

// ── solicitacaoTransferenciaSchema ─────────────────────────────────────────

describe('solicitacaoTransferenciaSchema', () => {
  it('aceita request válida com um item', () => {
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens: [VALID_ITEM] }).success,
    ).toBe(true)
  })

  it('rejeita lista vazia de itens', () => {
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens: [] }).success,
    ).toBe(false)
  })

  it('rejeita mais de 20 itens', () => {
    const itens = Array.from({ length: 21 }, () => ({ ...VALID_ITEM }))
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens }).success,
    ).toBe(false)
  })

  it('aceita exatamente 20 itens', () => {
    const itens = Array.from({ length: 20 }, () => ({ ...VALID_ITEM }))
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens }).success,
    ).toBe(true)
  })

  it('rejeita item com quantidade zero', () => {
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens: [{ ...VALID_ITEM, quantidade: 0 }] }).success,
    ).toBe(false)
  })

  it('rejeita item com quantidade negativa', () => {
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens: [{ ...VALID_ITEM, quantidade: -5 }] }).success,
    ).toBe(false)
  })

  it('rejeita item sem codigo', () => {
    expect(
      solicitacaoTransferenciaSchema.safeParse({ itens: [{ ...VALID_ITEM, codigo: '' }] }).success,
    ).toBe(false)
  })

  it('coerce string numérica para number na quantidade', () => {
    const result = solicitacaoTransferenciaSchema.safeParse({
      itens: [{ ...VALID_ITEM, quantidade: '5' }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.itens[0].quantidade).toBe(5)
    }
  })
})
