/**
 * Roda uma única vez antes de todos os testes E2E.
 * Faz login e salva o estado de autenticação (cookies/localStorage)
 * em e2e/.auth/user.json para ser reutilizado por todos os specs.
 *
 * Variáveis de ambiente necessárias:
 *   TEST_USER_EMAIL    — email do usuário de teste
 *   TEST_USER_PASSWORD — senha do usuário de teste
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

setup('autenticar usuário de teste', async ({ page }) => {
  const email    = process.env.TEST_USER_EMAIL    ?? 'user@test.com'
  const password = process.env.TEST_USER_PASSWORD ?? 'senha123'

  await page.goto('/login')

  await page.fill('#login-email', email)
  await page.fill('#login-password', password)
  await page.click('button[type="submit"]:has-text("Entrar")')

  // Aguarda redirecionamento para /home após login bem-sucedido
  await expect(page).toHaveURL(/\/home/, { timeout: 10_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
