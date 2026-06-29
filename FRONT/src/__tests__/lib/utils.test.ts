import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate, formatDateTime, addBusinessDays } from '@/lib/utils'

describe('cn', () => {
  it('combina classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolve conflito tailwind — último vence', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('ignora valores falsy', () => {
    expect(cn('foo', false && 'bar', null, undefined)).toBe('foo')
  })
})

describe('formatCurrency', () => {
  it('formata mil reais', () => {
    expect(formatCurrency(1000)).toMatch(/R\$\s*1\.000,00/)
  })

  it('formata valor com centavos', () => {
    expect(formatCurrency(9.9)).toMatch(/R\$\s*9,90/)
  })

  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/)
  })
})

describe('formatDate', () => {
  it('formata Date object para dd/mm/yyyy', () => {
    expect(formatDate(new Date(2024, 0, 15))).toBe('15/01/2024')
  })

  it('aceita string ISO e retorna dd/mm/yyyy', () => {
    // Hora 12:00 UTC evita ambiguidade de fuso
    expect(formatDate('2024-06-01T12:00:00Z')).toMatch(/01\/06\/2024/)
  })
})

describe('formatDateTime', () => {
  it('inclui hora e minuto', () => {
    const result = formatDateTime(new Date(2024, 0, 15, 9, 30))
    expect(result).toMatch(/15\/01\/2024/)
    expect(result).toMatch(/09:30/)
  })
})

describe('addBusinessDays', () => {
  const monday    = new Date(2024, 0, 8)  // seg 08/01
  const friday    = new Date(2024, 0, 5)  // sex 05/01

  it('adiciona 1 dia útil em segunda → terça', () => {
    const r = addBusinessDays(monday, 1)
    expect(r.getDay()).toBe(2)
    expect(r.getDate()).toBe(9)
  })

  it('sexta + 1 dia útil = segunda (pula fim de semana)', () => {
    const r = addBusinessDays(friday, 1)
    expect(r.getDay()).toBe(1)
    expect(r.getDate()).toBe(8)
  })

  it('sexta + 2 dias úteis = terça', () => {
    const r = addBusinessDays(friday, 2)
    expect(r.getDay()).toBe(2)
    expect(r.getDate()).toBe(9)
  })

  it('não avança com 0 dias', () => {
    const r = addBusinessDays(monday, 0)
    expect(r.getDate()).toBe(monday.getDate())
  })
})
