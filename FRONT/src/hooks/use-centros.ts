"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

export interface Centro {
  id: string;
  codigo: string;
  label: string;
}

export function useCentros() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ data: Centro[] }>("/centros")
      .then((json) => {
        setCentros(json.data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { centros, loading, error };
}
