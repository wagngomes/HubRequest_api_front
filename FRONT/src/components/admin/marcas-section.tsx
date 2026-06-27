"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Trash2, Loader2, Search, X,
  Upload, Building2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { adminMarcaSchema } from "@/lib/validations/admin";
import type { AdminMarcaInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";

interface AdminMarca {
  id:            string;
  marca:         string;
  supridor:      string;
  emailSupridor: string;
}

/* ── Modal criar / editar ─────────────────────────────────────────────── */
function MarcaModal({
  open, onOpenChange, marca: marcaData, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  marca: AdminMarca | null;
  onSuccess: () => void;
}) {
  const isEdit = !!marcaData;
  const [isLoading, setIsLoading] = useState(false);

  const EMPTY: AdminMarcaInput = { marca: "", supridor: "-", emailSupridor: "" };

  const form = useForm<AdminMarcaInput>({
    resolver: zodResolver(adminMarcaSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) { form.reset(EMPTY); return; }
    form.reset(marcaData
      ? { marca: marcaData.marca, supridor: marcaData.supridor, emailSupridor: marcaData.emailSupridor }
      : EMPTY
    );
  }, [open, marcaData]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: AdminMarcaInput) {
    setIsLoading(true);
    try {
      const path   = isEdit ? `/admin/marcas/${marcaData!.id}` : "/admin/marcas";
      const method = isEdit ? "PATCH" : "POST";
      await apiFetch(path, { method, body: JSON.stringify(data) });
      toast({ title: isEdit ? "Marca atualizada!" : "Marca criada!" });
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
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {isEdit ? "Editar Supridor" : "Novo Supridor"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Marca *</Label>
            <Input
              {...form.register("marca")}
              readOnly={isEdit}
              disabled={isEdit}
              className={isEdit ? "bg-gray-50 border-dashed text-gray-500" : ""}
              placeholder="Ex: MARCA XYZ"
            />
            {form.formState.errors.marca && (
              <p className="text-xs text-red-500">{form.formState.errors.marca.message}</p>
            )}
            {isEdit && (
              <p className="text-[11px] text-gray-400">A marca não pode ser alterada</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Supridor</Label>
            <Input {...form.register("supridor")} placeholder="Nome do supridor" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">E-mail do Supridor</Label>
            <Input {...form.register("emailSupridor")} type="email" placeholder="supridor@email.com" />
            {form.formState.errors.emailSupridor && (
              <p className="text-xs text-red-500">{form.formState.errors.emailSupridor.message}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#16455C", color: "white" }}>
              {isLoading && <Loader2 size={14} className="animate-spin" />} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal upload CSV ─────────────────────────────────────────────────── */
function CsvUploadModal({
  open, onOpenChange, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!open) setResult(null); }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const json = await apiFetch<{ inserted: number; updated: number }>("/admin/marcas/upload", { method: "POST", body: formData });
      setResult({ inserted: json.inserted ?? 0, updated: json.updated ?? 0 });
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#2E9B7C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Upload de Supridores (CSV)
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            CSV com as colunas:{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">marca, supridor, emailsupridor</code>.
            Registros existentes serão atualizados.
          </p>
          {result ? (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E8F7F3" }}>
                <CheckCircle2 size={24} style={{ color: "#2E9B7C" }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Upload concluído!</p>
                <p className="text-sm text-gray-500 mt-1">
                  {result.inserted} inserido(s) · {result.updated} atualizado(s)
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: "#16455C", color: "white" }}>
                Fechar
              </Button>
            </div>
          ) : (
            <>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-[#16455C] hover:bg-[#EBF5F9]" style={{ borderColor: "#d1d5db" }}>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={uploading} />
                {uploading ? (
                  <Loader2 size={28} className="animate-spin mb-2" style={{ color: "#16455C" }} />
                ) : (
                  <Upload size={28} className="mb-2 text-gray-300" />
                )}
                <p className="text-sm text-gray-400">
                  {uploading ? "Processando..." : "Clique para selecionar o arquivo CSV"}
                </p>
              </label>
              <div className="flex justify-end">
                <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Seção principal ──────────────────────────────────────────────────── */
export function MarcasSection() {
  const [marcas, setMarcas]         = useState<AdminMarca[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen]   = useState(false);
  const [csvOpen, setCsvOpen]       = useState(false);
  const [editTarget, setEditTarget] = useState<AdminMarca | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMarca | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), search: s });
      const json = await apiFetch<{ data: AdminMarca[]; total: number; totalPages: number }>(`/admin/marcas?${params}`);
      setMarcas(json.data ?? []);
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
      await apiFetch(`/admin/marcas/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "Marca excluída!" });
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
            placeholder="Marca ou supridor..."
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCsvOpen(true)}
            className="gap-2 border-[#16455C] text-[#16455C] hover:bg-[#EBF5F9] hover:text-[#16455C]"
          >
            <Upload size={14} /> Upload CSV
          </Button>
          <Button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            style={{ backgroundColor: "#16455C", color: "white" }}
          >
            <Plus size={15} /> Novo Supridor
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        ) : marcas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Building2 size={36} className="mb-3 opacity-30" />
            <p className="text-sm">{search ? "Nenhuma marca encontrada" : "Nenhuma marca cadastrada"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Marca</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Supridor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>E-mail Supridor</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {marcas.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-sm text-gray-800">{m.marca}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.supridor === "-" ? <span className="text-gray-300">—</span> : m.supridor}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.emailSupridor || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-[#16455C] hover:bg-[#EBF5F9]"
                          onClick={() => { setEditTarget(m); setModalOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteTarget(m); setDeleteOpen(true); }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{total} marca(s)</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 px-2 text-xs">Anterior</Button>
            <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 px-2 text-xs">Próxima</Button>
          </div>
        )}
      </div>

      {/* Modais */}
      <MarcaModal open={modalOpen} onOpenChange={setModalOpen} marca={editTarget} onSuccess={() => load(page, search)} />
      <CsvUploadModal open={csvOpen} onOpenChange={setCsvOpen} onSuccess={() => load(page, search)} />

      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) { setDeleteOpen(false); setDeleteTarget(null); } }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#16455C" }}>Excluir marca</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Excluir a marca <strong>{deleteTarget?.marca}</strong>?
            Não será possível se houver produtos vinculados.
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
