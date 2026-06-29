import { describe, it, expect } from 'vitest'
import { formatBusinessHours } from '@/lib/business-hours'

describe('formatBusinessHours', () => {
  it('retorna "—" para null', () => {
    expect(formatBusinessHours(null)).toBe('—')
  })

  it('formata menos de 1h em minutos', () => {
    expect(formatBusinessHours(0.5)).toBe('30min')
  })

  it('formata horas exatas sem minutos', () => {
    expect(formatBusinessHours(3)).toBe('3h')
  })

  it('formata horas e minutos', () => {
    expect(formatBusinessHours(2.5)).toBe('2h 30min')
  })

  it('formata 1h15min', () => {
    expect(formatBusinessHours(1.25)).toBe('1h 15min')
  })

  it('formata valor próximo de zero em minutos', () => {
    expect(formatBusinessHours(0.25)).toBe('15min')
  })
})
