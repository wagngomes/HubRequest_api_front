/**
 * Testes E2E — Travas
 * Cobre: listagem por área, controle de acesso (apenas editores autorizados
 * veem o botão "Nova Trava" e "Upload CSV"), modal de detalhes.
 *
 * Usa a sessão salva pelo auth.setup.ts.
 * Por padrão o usuário de teste é COMERCIAL (não é editor de travas).
 */
import { test, expect } from '@playwright/test'

test('card "Travas | Regras" aparece na home e navega para /travas', async ({ page }) => {
  await page.goto('/home')

  const card = page.locator('text=/travas/i').first()
  await expect(card).toBeVisible()
  await card.click()

  await expect(page).toHaveURL(/\/travas/)
})

test('página de travas renderiza cards por área', async ({ page }) => {
  await page.goto('/travas')

  // Deve haver cards para as áreas: COMERCIAL, COMPRAS, PLANEJAMENTO, PRICING, FISCAL
  await expect(page.locator('[data-testid="area-card"], .area-card').first()).toBeVisible({
    timeout: 5_000,
  })
})

test('usuário sem permissão NÃO vê botões de edição (Nova Trava / Upload CSV)', async ({ page }) => {
  await page.goto('/travas')

  // Aguarda a página carregar
  await expect(page.locator('h1, h2').first()).toBeVisible()

  // Botões de edição não devem existir para usuário não autorizado
  await expect(page.getByRole('button', { name: /nova trava/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /upload csv/i })).toHaveCount(0)
})

test('clique em card de área abre modal com lista de travas', async ({ page }) => {
  await page.goto('/travas')

  // Clica no primeiro card de área disponível
  const firstCard = page.locator('[data-testid="area-card"], .area-card, [role="button"]')
    .filter({ hasText: /comercial|compras|planejamento|pricing|fiscal/i })
    .first()

  await firstCard.click()

  // Modal ou painel com lista de travas deve abrir
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3_000 })
})

test('modal de área exibe colunas: nome da trava, mensagem, status', async ({ page }) => {
  await page.goto('/travas')

  const firstCard = page.locator('[data-testid="area-card"], .area-card, [role="button"]')
    .filter({ hasText: /comercial|compras|planejamento|pricing|fiscal/i })
    .first()

  await firstCard.click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible({ timeout: 3_000 })

  // Cabeçalhos da tabela
  await expect(dialog.locator('text=/nome|trava/i').first()).toBeVisible()
  await expect(dialog.locator('text=/mensagem/i').first()).toBeVisible()
  await expect(dialog.locator('text=/status/i').first()).toBeVisible()
})
