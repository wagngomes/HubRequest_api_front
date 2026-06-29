// Blacklist de tokens JWT invalidados no logout
// Usa Map<token, expiresAt> para limpeza automática de entradas vencidas
const blacklist = new Map<string, number>()

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000 // limpeza a cada 15 min

setInterval(() => {
  const now = Date.now()
  for (const [token, expiresAt] of blacklist) {
    if (expiresAt < now) blacklist.delete(token)
  }
}, CLEANUP_INTERVAL_MS).unref() // .unref() não impede o processo de encerrar

export function addToBlacklist(token: string, expiresAt: number): void {
  blacklist.set(token, expiresAt)
}

export function isBlacklisted(token: string): boolean {
  const expiresAt = blacklist.get(token)
  if (expiresAt === undefined) return false
  if (expiresAt < Date.now()) {
    blacklist.delete(token)
    return false
  }
  return true
}
