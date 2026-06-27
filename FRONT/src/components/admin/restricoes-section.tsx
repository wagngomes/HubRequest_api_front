"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Trash2, Loader2, Search, X, ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { adminRestricaoSchema } from "@/lib/validations/admin";
import type { AdminRestricaoInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";
import { useCentros } from "@/hooks/use-centros";

interface AdminRestricao {
  id:         string;
  tributacao: string;
  origem:     string;
  destino:    string;
}

/* ── Modal criar ─────────────────────────────────────────────────────── */
function RestricaoModal({
  open, onOpenChange, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { centros } = useCentros();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminRestricaoInput>({
    resolver: zodResolver(adminRestricaoSchema),
    defaultValues: { tributacao: "", origem: "", destino: "" },
  });

  useEffect(() => {
    if (!open) form.reset({ tributacao: "", origem: "", destino: "" });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: AdminRestricaoInput) {
    setIsLoading(true);
    try {
      await apiFetch("/admin/restricoes", { method: "POST", body: JSON.stringify(data) });
      toast({ title: "Restrição criada!" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#dc2626" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Nova Restrição de Transferência
            </DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tributação *</Label>
            <Input {...form.register("tributacao")} placeholder="Ex: ST, ICMS, ISS" />
            {form.formState.errors.tributacao && (
              <p className="text-xs text-red-500">{form.formState.errors.tributacao.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Origem *</Label>
              <Controller control={form.control} name="origem" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o CD" /></SelectTrigger>
                  <SelectContent>
                    {centros.map((cd) => (
                      <SelectItem key={cd.codigo} value={cd.codigo}>{cd.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {form.formState.errors.origem && (
                <p className="text-xs text-red-500">{form.formState.errors.origem.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destino *</Label>
              <Controller control={form.control} name="destino" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o CD" /></SelectTrigger>
                  <SelectContent>
                    {centros.map((cd) => (
                      <SelectItem key={cd.codigo} value={cd.codigo}>{cd.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {form.formState.errors.destino && (
                <p className="text-xs text-red-500">{form.formState.errors.destino.message}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#dc2626", color: "white" }}>
              {isLoading && <Loader2 size={14} className="animate-spin" />} Adicionar Restrição
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Seção principal ──────────────────────────────────────────────────── */
export function RestricoesSection() {
  const [restricoes, setRestricoes] = useState<AdminRestricao[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminRestricao | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), search: s });
      const json = await apiFetch<{ data: AdminRestricao[]; total: number; totalPages: number }>(`/admin/restricoes?${params}`);
      setRestricoes(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search); }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  useEffect(() => { load(page, search); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/restricoes/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "Restrição excluída!" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      load(page, search);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tributação, origem ou destino..."
            className="pl-9 pr-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <Button onClick={() => setModalOpen(true)} style={{ backgroundColor: "#dc2626", color: "white" }}>
          <Plus size={15} /> Nova Restrição
        </Button>
      </div>

      <div
        className="flex items-start gap-2 p-3 rounded-lg border text-xs text-amber-800"
        style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
      >
        <ShieldX size={14} className="shrink-0 mt-0.5 text-amber-600" />
        <span>
          Combinações de Tributação + Origem + Destino cadastradas aqui bloqueiam automaticamente
          a abertura de solicitações de transferência.
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        ) : restricoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <ShieldX size={36} className="mb-3 opacity-30" />
            <p className="text-sm">{search ? "Nenhuma restrição encontrada" : "Nenhuma restrição cadastrada"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Tributação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>CD Origem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>CD Destino</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {restricoes.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-red-700">{r.tributacao}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.origem}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.destino}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => { setDeleteTarget(r); setDeleteOpen(true); }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{total} restrição(ões)</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 px-2 text-xs">Anterior</Button>
            <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 px-2 text-xs">Próxima</Button>
          </div>
        )}
      </div>

      {/* Modais */}
      <RestricaoModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={() => load(page, search)} />

      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) { setDeleteOpen(false); setDeleteTarget(null); } }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#dc2626" }}>Excluir restrição</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Remover a restrição <strong>{deleteTarget?.tributacao}</strong>{" "}
            ({deleteTarget?.origem} → {deleteTarget?.destino})?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>Cancelar</Button>
            <Button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: "#dc2626", color: "white" }}>
              {deleting && <Loader2 size={14} className="animate-spin" />} Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
