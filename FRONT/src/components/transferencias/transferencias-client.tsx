"use client";

import { useState, useCallback } from "react";
import { Plus, RefreshCw, Search, Filter, User, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferenciasTable } from "./transferencias-table";
import { TransferenciaModal } from "./transferencia-modal";
import { useTransferencias } from "@/hooks/use-transferencias";
import { useSlas } from "@/hooks/use-slas";
import { apiFetchBlob } from "@/lib/api-client";

interface TransferenciasClientProps {
  isPlanejamento: boolean;
}

export function TransferenciasClient({ isPlanejamento }: TransferenciasClientProps) {
  const [modalOpen, setModalOpen]   = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalMode, setModalMode]   = useState<"view" | "create" | "status">("create");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supridorFilter, setSupridorFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, refetch } = useTransferencias({
    search,
    status:   statusFilter === "all" ? undefined : statusFilter as "PENDENTE" | "PROCESSADA",
    supridor: supridorFilter || undefined,
    page,
    limit: 10,
  });

  const { getSla } = useSlas();

  const handleOpenCreate = () => {
    setSelectedId(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleView = useCallback((id: string) => {
    setSelectedId(id);
    setModalMode("view");
    setModalOpen(true);
  }, []);

  const handleItemStatus = useCallback((id: string) => {
    setSelectedId(id);
    setModalMode("status");
    setModalOpen(true);
  }, []);

  function handleModalSuccess() {
    setModalOpen(false);
    refetch();
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const query = new URLSearchParams();
      if (search)               query.set("search",   search);
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (supridorFilter)       query.set("supridor", supridorFilter);

      const blob = await apiFetchBlob(`/transferencias/export?${query}`);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `transferencias_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 max-w-3xl">
          {/* Busca geral */}
          <div className="relative flex-1 min-w-44">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Código, descrição, origem..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          {/* Filtro por Supridor */}
          <div className="relative min-w-40">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Filtrar supridor..."
              value={supridorFilter}
              onChange={(e) => { setSupridorFilter(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PROCESSADA">Processada</SelectItem>
                <SelectItem value="NAO_PROCESSADA">Não Processada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            style={{ borderColor: "#16455C", color: "#16455C" }}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
          {isPlanejamento && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              style={{ borderColor: "#16455C", color: "#16455C" }}
            >
              {isExporting
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />
              }
              Baixar xlsx
            </Button>
          )}
          <Button onClick={handleOpenCreate} style={{ backgroundColor: "#16455C", color: "white" }}>
            <Plus size={16} />
            Nova Transferência
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <TransferenciasTable
        data={data?.data ?? []}
        isLoading={isLoading}
        isPlanejamento={isPlanejamento}
        total={data?.total ?? 0}
        page={page}
        limit={10}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onView={handleView}
        onItemStatus={handleItemStatus}
        onRefetch={refetch}
        getSla={getSla}
      />

      {/* Modal */}
      <TransferenciaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        id={selectedId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
