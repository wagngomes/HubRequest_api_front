"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { PaginatedResponse, LiberacaoItemWithSolicitacao } from "@/types";

interface UseLiberacoesParams {
  search?: string;
  status?: "PENDENTE" | "PROCESSADA";
  page?: number;
  limit?: number;
}

export function useLiberacoes(params: UseLiberacoesParams = {}) {
  const [data, setData] = useState<PaginatedResponse<LiberacaoItemWithSolicitacao> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.page)   query.set("page",   String(params.page));
    if (params.limit)  query.set("limit",  String(params.limit));

    try {
      const json = await apiFetch<PaginatedResponse<LiberacaoItemWithSolicitacao>>(
        `/liberacoes?${query}`
      );
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [params.search, params.status, params.page, params.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
