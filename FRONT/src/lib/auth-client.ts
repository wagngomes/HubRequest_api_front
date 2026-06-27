"use client"

import { useState, useEffect } from "react"
import { apiFetch, setToken, removeToken } from "./api-client"

export interface SessionUser {
  id: string
  email: string
  name: string
  nome: string
  role: "ADMIN" | "USER"
  setor: "PLANEJAMENTO" | "COMERCIAL" | "OPERACOES" | "OUTRO"
}

interface LoginResponse {
  token: string
  user: SessionUser
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  const res = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setToken(res.token)
  return res.user
}

export async function signUp(
  nome: string,
  email: string,
  password: string,
  setor: SessionUser["setor"]
): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nome, email, password, setor }),
    skipAuth: true,
  })
}

export async function signOut(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" })
  } finally {
    removeToken()
    window.location.href = "/login"
  }
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    apiFetch<{ data: SessionUser }>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsPending(false))
  }, [])

  return { data: user ? { user } : null, isPending }
}
