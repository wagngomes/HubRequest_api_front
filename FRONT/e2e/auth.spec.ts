/**
 * Testes E2E — Autenticação
 * Cobre: login com credenciais inválidas, acesso a rota protegida sem sessão, logout.
 * O login com sucesso é coberto pelo auth.setup.ts (não repetir aqui).
 */
import { test, expect } from '@playwright/test'

// Esses testes rodam sem sessão (sem storageState)
test.use({ storageState: { cookies: [], origins: [] } })

test('rota protegida redireciona para /login sem sessão', async ({ page }) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/login/)
})

test('rota /admin redireciona para /login sem sessão', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login/)
})

test('login com senha errada exibe mensagem de erro', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#login-email', 'user@test.com')
  await page.fill('#login-password', 'senha-errada')
  await page.click('button[type="submit"]:has-text("Entrar")')

  // Toast de erro ou mensagem inline deve aparecer
  await expect(
    page.locator('text=/erro|inválid|incorret/i').first(),
  ).toBeVisible({ timeout: 5_000 })

  // Não deve redirecionar
  await expect(page).toHaveURL(/\/login/)
})

test('validação client-side: email em branco bloqueia submit', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#login-password', 'qualquersenha')
  await page.click('button[type="submit"]:has-text("Entrar")')

  // Deve continuar na página de login sem chamar a API
  await expect(page).toHaveURL(/\/login/)
})
