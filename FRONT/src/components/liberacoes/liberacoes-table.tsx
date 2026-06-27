"use client";

import { useState } from "react";
import { Eye, Trash2, CheckCircle, MoreHorizontal, Loader2, RotateCcw } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, RetornoBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { LiberacaoItemWithSolicitacao } from "@/types";

const ACAO_LABEL: Record<string, string> = {
  HABILITAR: "Habilitar",
  DESABILITAR: "Desabilitar",
};

interface LiberacoesTableProps {
  data: LiberacaoItemWithSolicitacao[];
  isLoading: boolean;
  isPlanejamento: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onView: (solicitacaoId: string) => void;
  onItemStatus: (itemId: string) => void;
  onRetorno: (solicitacaoId: string) => void;
  onRefetch: () => void;
}

export function LiberacoesTable({
  data, isLoading, isPlanejamento, total, page, totalPages,
  onPageChange, onView, onItemStatus, onRetorno, onRefetch,
}: LiberacoesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(solicitacaoId: string) {
    if (!confirm("Confirma a exclusão desta solicitação? Todos os itens serão removidos.")) return;
    setDeletingId(solicitacaoId);
    try {
      const res = await fetch(`/api/liberacoes/${solicitacaoId}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast({ title: "Solicitação excluída com sucesso" });
      onRefetch();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
        <Loader2 size={32} className="animate-spin" style={{ color: "#2E9B7C" }} />
      </div>
    );
  }

  // colunas: ID Solicitação, Código, Descrição, Contrato, Ação, Qtd, Status, Retorno, [Solicitante], Data, Actions
  const colSpan = isPlanejamento ? 10 : 9;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "#F5F5F5" }}>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>ID Solicitação</TableHead>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Código</TableHead>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Descrição</TableHead>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Contrato</TableHead>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Ação</TableHead>
              <TableHead className="font-semibold text-center" style={{ color: "#16455C" }}>Qtd</TableHead>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Status</TableHead>
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Retorno</TableHead>
              {isPlanejamento && (
                <TableHead className="font-semibold" style={{ color: "#16455C" }}>Solicitante</TableHead>
              )}
              <TableHead className="font-semibold" style={{ color: "#16455C" }}>Data</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-12 text-gray-400">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => {
                const isNewGroup = idx === 0 || data[idx - 1].solicitacaoId !== item.solicitacaoId;
                return (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-gray-50 ${isNewGroup && idx > 0 ? "border-t-2 border-gray-200" : ""}`}
                  >
                    {/* ── ID da Solicitação ── */}
                    <TableCell>
                      <span
                        className="font-mono text-xs font-bold tracking-wider"
                        style={{ color: isNewGroup ? "#16455C" : "#90AFC5" }}
                        title={`Solicitação ${item.solicitacaoId}`}
                      >
                        {item.solicitacaoId}
                      </span>
                    </TableCell>

                    {/* ── Código ── */}
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-gray-800">{item.codigo}</span>
                    </TableCell>

                    {/* ── Descrição ── */}
                    <TableCell className="text-sm text-gray-700 max-w-45">
                      <span className="truncate block">{item.descricao}</span>
                    </TableCell>

                    {/* ── Contrato ── */}
                    <TableCell className="text-sm text-gray-600">
                      {isNewGroup ? item.solicitacao.contrato : <span className="text-gray-300">—</span>}
                    </TableCell>

                    {/* ── Ação ── */}
                    <TableCell>
                      {isNewGroup ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.solicitacao.acao === "HABILITAR"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {ACAO_LABEL[item.solicitacao.acao] ?? item.solicitacao.acao}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </TableCell>

                    {/* ── Quantidade ── */}
                    <TableCell className="text-center text-sm font-medium text-gray-800">
                      {item.quantidade}
                    </TableCell>

                    {/* ── Status (da solicitação) ── */}
                    <TableCell><StatusBadge status={item.solicitacao.status} /></TableCell>

                    {/* ── Retorno (da solicitação) ── */}
                    <TableCell>
                      {isNewGroup
                        ? <RetornoBadge retorno={item.solicitacao.retornoPlanejamento} />
                        : <span className="text-gray-300 text-xs">—</span>}
                    </TableCell>

                    {/* ── Solicitante (Planejamento) ── */}
                    {isPlanejamento && (
                      <TableCell className="text-sm text-gray-600">
                        {isNewGroup ? item.solicitacao.user.nome : <span className="text-gray-300">—</span>}
                      </TableCell>
                    )}

                    {/* ── Data ── */}
                    <TableCell className="text-sm text-gray-500">{formatDate(item.createdAt)}</TableCell>

                    {/* ── Ações ── */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#16455C] hover:bg-[#EBF5F9]"
                            disabled={deletingId === item.solicitacaoId}
                          >
                            {deletingId === item.solicitacaoId
                              ? <Loader2 size={14} className="animate-spin" />
                              : <MoreHorizontal size={14} />
                            }
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => onView(item.solicitacaoId)}
                          >
                            <Eye size={14} /> Ver solicitação completa
                          </DropdownMenuItem>

                          {isPlanejamento && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-[#16455C] focus:text-[#16455C]"
                                onClick={() => onItemStatus(item.id)}
                              >
                                <CheckCircle size={14} /> Atualizar status do item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700"
                                onClick={() => onRetorno(item.solicitacaoId)}
                              >
                                <RotateCcw size={14} /> Atualizar retorno
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(item.solicitacaoId)}
                          >
                            <Trash2 size={14} /> Excluir solicitação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {total} item(ns) — Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Próxima</Button>
          </div>
        </div>
      )}
      {totalPages <= 1 && total > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">{total} item(ns)</p>
        </div>
      )}
    </div>
  );
}
