"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { PaginatedResponse, TransferenciaItemWithSolicitacao } from "@/types";

interface UseTransferenciasParams {
  search?:    string;
  status?:    "PENDENTE" | "PROCESSADA";
  supridor?:  string;
  page?:      number;
  limit?:     number;
}

export function useTransferencias(params: UseTransferenciasParams = {}) {
  const [data, setData]       = useState<PaginatedResponse<TransferenciaItemWithSolicitacao> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const query = new URLSearchParams();
    if (params.search)   query.set("search",   params.search);
    if (params.status)   query.set("status",   params.status);
    if (params.supridor) query.set("supridor", params.supridor);
    if (params.page)     query.set("page",     String(params.page));
    if (params.limit)    query.set("limit",    String(params.limit));

    try {
      const json = await apiFetch<PaginatedResponse<TransferenciaItemWithSolicitacao>>(
        `/transferencias?${query}`
      );
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [params.search, params.status, params.supridor, params.page, params.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
