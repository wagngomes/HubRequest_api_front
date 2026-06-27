"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Sla } from "@/types";

export function useSlas() {
  const [slas, setSlas]     = useState<Sla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: Sla[] }>("/slas")
      .then((json) => setSlas(json.data ?? []))
      .catch(() => setSlas([]))
      .finally(() => setLoading(false));
  }, []);

  /** Map "ORIGEM|DESTINO" → dias de SLA para lookup O(1) */
  const slaMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of slas) {
      m.set(`${s.origem}|${s.destino}`, s.sla);
    }
    return m;
  }, [slas]);

  /** Map "ORIGEM|DESTINO" → liberado ("S" | "N") para verificação de rota */
  const liberadoMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of slas) {
      m.set(`${s.origem}|${s.destino}`, s.liberado ?? "S");
    }
    return m;
  }, [slas]);

  function getSla(origem: string, destino: string): number | null {
    return slaMap.get(`${origem}|${destino}`) ?? null;
  }

  /** Retorna true se a rota está liberada (ou não existe cadastro, assume liberado) */
  function isLiberado(origem: string, destino: string): boolean {
    const value = liberadoMap.get(`${origem}|${destino}`);
    if (value === undefined) return true; // sem cadastro = assume liberado
    return value === "S";
  }

  return { slas, loading, slaMap, liberadoMap, getSla, isLiberado };
}
