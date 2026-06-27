import { cookies } from "next/headers"
import type { SessionUser } from "@/types"

export function isPlanejamento(user: SessionUser): boolean {
  return user.setor === "PLANEJAMENTO"
}

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("hub_token")?.value
  if (!token) return null

  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    ) as Record<string, unknown>

    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp === "number" && payload.exp < now) return null

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name ?? payload.nome) as string,
      nome: (payload.nome ?? payload.name) as string,
      role: payload.role as SessionUser["role"],
      setor: payload.setor as SessionUser["setor"],
    }
  } catch {
    return null
  }
}
