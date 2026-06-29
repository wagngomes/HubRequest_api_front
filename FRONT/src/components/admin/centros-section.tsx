"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Trash2, Loader2, Search, X, MapPin, Upload, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { adminCentroSchema } from "@/lib/validations/admin";
import type { AdminCentroInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";

interface AdminCentro {
  id:        string;
  codigo:    string;
  label:     string;
  createdAt: string;
}

/* ── Modal criar / editar ─────────────────────────────────────────────── */
interface CentroModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  centro: AdminCentro | null;
  onSuccess: () => void;
}

function CentroModal({ open, onOpenChange, centro, onSuccess }: CentroModalProps) {
  const isEdit = !!centro;
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminCentroInput>({
    resolver: zodResolver(adminCentroSchema),
    defaultValues: { codigo: "", label: "" },
  });

  useEffect(() => {
    if (!open) { form.reset(); return; }
    if (centro) {
      form.reset({ codigo: centro.codigo, label: centro.label });
    } else {
      form.reset({ codigo: "", label: "" });
    }
  }, [open, centro]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: AdminCentroInput) {
    setIsLoading(true);
    try {
      const path   = isEdit ? `/admin/centros/${centro!.id}` : "/admin/centros";
      const method = isEdit ? "PATCH" : "POST";
      await apiFetch(path, { method, body: JSON.stringify(data) });
      toast({ title: isEdit ? "Centro atualizado!" : "Centro criado!" });
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
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {isEdit ? "Editar Centro" : "Novo Centro de Distribuição"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código *</Label>
            <Input
              {...form.register("codigo")}
              className="font-mono uppercase"
              placeholder="Ex: CD-SP01"
              readOnly={isEdit}
              disabled={isEdit}
            />
            {form.formState.errors.codigo && <p className="text-xs text-red-500">{form.formState.errors.codigo.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nome / Label *</Label>
            <Input
              {...form.register("label")}
              placeholder="Ex: Centro SP — São Paulo"
            />
            {form.formState.errors.label && <p className="text-xs text-red-500">{form.formState.errors.label.message}</p>}
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
interface CentrosCsvUploadModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function CentrosCsvUploadModal({ open, onOpenChange, onSuccess }: CentrosCsvUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setResult(null);
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const json = await apiFetch<{ inserted: number; updated: number }>("/admin/centros/upload", { method: "POST", body: formData });
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
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Upload de Centros (CSV)
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            Selecione um arquivo CSV (separador detectado automaticamente) com as colunas:{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">codigo, label</code>.
            A coluna <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">nome</code> também é aceita como alias de{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">label</code>.
            Registros existentes serão atualizados automaticamente.
          </p>

          {result ? (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF5F9" }}>
                <CheckCircle2 size={24} style={{ color: "#16455C" }} />
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
              <label
                className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-[#16455C] hover:bg-[#EBF5F9]"
                style={{ borderColor: "#d1d5db" }}
              >
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
                <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Seção principal ──────────────────────────────────────────────────── */
export function CentrosSection() {
  const [centros, setCentros]       = useState<AdminCentro[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]       = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editTarget, setEditTarget]     = useState<AdminCentro | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCentro | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: AdminCentro[] }>("/admin/centros");
      setCentros(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = centros.filter((c) => {
    const q = search.toLowerCase();
    return c.codigo.toLowerCase().includes(q) || c.label.toLowerCase().includes(q);
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/centros/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "Centro excluído!" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por código ou nome..."
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCsvModalOpen(true)}
            style={{ borderColor: "#16455C", color: "#16455C" }}
          >
            <Upload size={15} /> Upload CSV
          </Button>
          <Button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            style={{ backgroundColor: "#16455C", color: "white" }}
          >
            <Plus size={15} /> Novo centro
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <MapPin size={36} className="mb-3 opacity-30" />
            <p className="text-sm">{search ? "Nenhum centro encontrado" : "Nenhum centro cadastrado"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Nome / Label</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "#16455C" }}>{c.codigo}</td>
                    <td className="px-4 py-3 text-gray-700">{c.label}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-[#16455C] hover:bg-[#EBF5F9]"
                          onClick={() => { setEditTarget(c); setModalOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }}
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

      <p className="text-xs text-gray-400">{filtered.length} centro(s)</p>

      {/* Modal criar/editar */}
      <CentroModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        centro={editTarget}
        onSuccess={load}
      />

      {/* Modal upload CSV */}
      <CentrosCsvUploadModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        onSuccess={load}
      />

      {/* Confirmação exclusão */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) { setDeleteOpen(false); setDeleteTarget(null); } }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#16455C" }}>Excluir centro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Tem certeza que deseja excluir o centro{" "}
            <strong className="font-mono">{deleteTarget?.codigo}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>Cancelar</Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              style={{ backgroundColor: "#dc2626", color: "white" }}
            >
              {deleting && <Loader2 size={14} className="animate-spin" />} Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
