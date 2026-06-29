"use client"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("hub_token")
}

export function setToken(token: string): void {
  localStorage.setItem("hub_token", token)
  document.cookie = `hub_token=${token}; path=/; max-age=28800; SameSite=Lax`
}

export function removeToken(): void {
  localStorage.removeItem("hub_token")
  document.cookie = "hub_token=; path=/; max-age=0"
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...init } = options

  const headers = new Headers(init.headers)

  if (!skipAuth) {
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (res.status === 401) {
    removeToken()
    window.location.href = "/login"
    throw new Error("Sessão expirada")
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }))
    throw new Error((err as { error?: string }).error ?? "Erro na requisição")
  }

  return res.json() as Promise<T>
}

export async function apiFetchBlob(path: string, options: FetchOptions = {}): Promise<Blob> {
  const { skipAuth, ...init } = options
  const headers = new Headers(init.headers)
  if (!skipAuth) {
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (res.status === 401) {
    removeToken()
    window.location.href = "/login"
    throw new Error("Sessão expirada")
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }))
    throw new Error((err as { error?: string }).error ?? "Erro na requisição")
  }
  return res.blob()
}
