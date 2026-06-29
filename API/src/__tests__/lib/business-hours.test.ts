import { describe, it, expect } from 'vitest'
import { businessHoursBetween } from '../../lib/business-hours.js'

// Dia fixo: segunda 2024-01-08, horário comercial 08:00–17:00
const day = (h: number, m = 0) => new Date(`2024-01-08T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)

describe('businessHoursBetween', () => {
  it('zero quando fim <= início', () => {
    expect(businessHoursBetween(day(10), day(9))).toBe(0)
    expect(businessHoursBetween(day(10), day(10))).toBe(0)
  })

  it('horas exatas no mesmo dia útil', () => {
    expect(businessHoursBetween(day(9), day(12))).toBe(3)
    expect(businessHoursBetween(day(8), day(17))).toBe(9)
  })

  it('corta ao início do expediente quando início é antes das 08h', () => {
    expect(businessHoursBetween(day(6), day(10))).toBe(2)
  })

  it('avança para o próximo dia útil quando início é após 17h', () => {
    // início às 18h de segunda → conta a partir das 08h de terça
    const seg18 = day(18)
    const ter10 = new Date('2024-01-09T10:00:00') // terça
    expect(businessHoursBetween(seg18, ter10)).toBe(2)
  })

  it('pula fins de semana', () => {
    // sexta 16h a segunda 10h = 1h (sexta) + 2h (segunda) = 3h
    const sex16 = new Date('2024-01-05T16:00:00') // sexta
    const seg10 = new Date('2024-01-08T10:00:00') // segunda
    expect(businessHoursBetween(sex16, seg10)).toBe(3)
  })

  it('múltiplos dias úteis completos', () => {
    // segunda 08h a quarta 17h = 3 dias × 9h = 27h
    const seg08 = day(8)
    const qua17 = new Date('2024-01-10T17:00:00')
    expect(businessHoursBetween(seg08, qua17)).toBe(27)
  })
})
