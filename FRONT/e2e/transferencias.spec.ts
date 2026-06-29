/**
 * Testes E2E — Transferências
 * Cobre: listagem, formulário de nova solicitação, validação client-side.
 * Usa a sessão salva pelo auth.setup.ts (usuário COMERCIAL por padrão).
 *
 * Variável adicional:
 *   TEST_PLANEJAMENTO_EMAIL    — email de usuário do setor PLANEJAMENTO
 *   TEST_PLANEJAMENTO_PASSWORD — senha
 */
import { test, expect } from '@playwright/test'

test('página de transferências carrega com lista', async ({ page }) => {
  await page.goto('/transferencias')
  await expect(page).toHaveURL(/\/transferencias/)

  // Título da página deve aparecer
  await expect(page.locator('h1, h2').filter({ hasText: /transferência/i }).first()).toBeVisible()
})

test('botão "Nova Solicitação" abre formulário/modal', async ({ page }) => {
  await page.goto('/transferencias')

  const botaoNova = page.getByRole('button', { name: /nova solicitação/i })
  await expect(botaoNova).toBeVisible()
  await botaoNova.click()

  // Formulário ou modal deve abrir
  await expect(
    page.locator('text=/nova solicitação|adicionar item/i').first(),
  ).toBeVisible({ timeout: 3_000 })
})

test('formulário valida campos obrigatórios antes de enviar', async ({ page }) => {
  await page.goto('/transferencias')

  await page.getByRole('button', { name: /nova solicitação/i }).click()

  // Tenta enviar sem preencher nada
  const botaoEnviar = page.getByRole('button', { name: /enviar|salvar|criar/i }).last()
  await botaoEnviar.click()

  // Mensagem de erro de validação deve aparecer
  await expect(
    page.locator('text=/obrigatório|required/i').first(),
  ).toBeVisible({ timeout: 3_000 })
})

test('usuário COMERCIAL não vê botão de exportar (exclusivo PLANEJAMENTO)', async ({ page }) => {
  await page.goto('/transferencias')

  // Botão de export CSV é exclusivo do setor PLANEJAMENTO
  const exportBtn = page.getByRole('button', { name: /export|baixar/i })
  await expect(exportBtn).toHaveCount(0)
})
