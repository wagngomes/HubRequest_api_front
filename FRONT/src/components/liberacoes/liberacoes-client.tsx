"use client";

import { useState, useCallback } from "react";
import { Plus, RefreshCw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiberacoesTable } from "./liberacoes-table";
import { LiberacaoModal } from "./liberacao-modal";
import { useLiberacoes } from "@/hooks/use-liberacoes";

interface LiberacoesClientProps {
  isPlanejamento: boolean;
}

export function LiberacoesClient({ isPlanejamento }: LiberacoesClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "create" | "retorno" | "status">("create");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useLiberacoes({
    search,
    status: statusFilter === "all" ? undefined : statusFilter as "PENDENTE" | "PROCESSADA",
    page,
    limit: 10,
  });

  const handleOpenCreate = () => {
    setSelectedId(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleView = useCallback((solicitacaoId: string) => {
    setSelectedId(solicitacaoId);
    setModalMode("view");
    setModalOpen(true);
  }, []);

  const handleItemStatus = useCallback((itemId: string) => {
    setSelectedId(itemId);
    setModalMode("status");
    setModalOpen(true);
  }, []);

  const handleRetorno = useCallback((solicitacaoId: string) => {
    setSelectedId(solicitacaoId);
    setModalMode("retorno");
    setModalOpen(true);
  }, []);

  function handleModalSuccess() {
    setModalOpen(false);
    refetch();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por código, contrato, solicitante..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PROCESSADA">Processada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            style={{ borderColor: "#2E9B7C", color: "#2E9B7C" }}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={handleOpenCreate} style={{ backgroundColor: "#2E9B7C", color: "white" }}>
            <Plus size={16} />
            Nova Liberação
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <LiberacoesTable
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
        onRetorno={handleRetorno}
        onRefetch={refetch}
      />

      {/* Modal */}
      <LiberacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        id={selectedId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
