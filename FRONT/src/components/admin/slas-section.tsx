"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Loader2, Search, X, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { adminSlaSchema } from "@/lib/validations/admin";
import type { AdminSlaInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";
import { useCentros } from "@/hooks/use-centros";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Sla } from "@/types";

/* ── Modal criar / editar ─────────────────────────────────────────────── */
interface SlaModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sla: Sla | null;
  onSuccess: () => void;
}

function SlaModal({ open, onOpenChange, sla, onSuccess }: SlaModalProps) {
  const isEdit = !!sla;
  const [isLoading, setIsLoading] = useState(false);
  const { centros } = useCentros();

  const form = useForm<AdminSlaInput>({
    resolver: zodResolver(adminSlaSchema),
    defaultValues: { origem: "", siglaOrigem: "", destino: "", siglaDestino: "", sla: 0, liberado: "S" },
  });

  useEffect(() => {
    if (!open) { form.reset(); return; }
    if (sla) {
      form.reset({
        origem:       sla.origem,
        siglaOrigem:  sla.siglaOrigem,
        destino:      sla.destino,
        siglaDestino: sla.siglaDestino,
        sla:          sla.sla,
        liberado:     (sla.liberado ?? "S") as "S" | "N",
      });
    } else {
      form.reset({ origem: "", siglaOrigem: "", destino: "", siglaDestino: "", sla: 0, liberado: "S" });
    }
  }, [open, sla]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: AdminSlaInput) {
    setIsLoading(true);
    try {
      const path   = isEdit ? `/admin/slas/${sla!.id}` : "/admin/slas";
      const method = isEdit ? "PATCH" : "POST";
      await apiFetch(path, { method, body: JSON.stringify(data) });
      toast({ title: isEdit ? "SLA atualizado!" : "SLA criado!" });
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
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {isEdit ? "Editar SLA" : "Novo SLA entre CDs"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Origem */}
          <div className="p-3 rounded-lg border border-gray-200 space-y-3" style={{ backgroundColor: "#EBF5F9" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>CD Origem</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">CD *</Label>
                <Controller control={form.control} name="origem" render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => {
                    field.onChange(v);
                    const cd = centros.find((c) => c.codigo === v);
                    if (cd) form.setValue("siglaOrigem", cd.codigo);
                  }}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {centros.map((c) => (
                        <SelectItem key={c.codigo} value={c.codigo}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {form.formState.errors.origem && <p className="text-xs text-red-500">{form.formState.errors.origem.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sigla *</Label>
                <Input
                  {...form.register("siglaOrigem")}
                  placeholder="Ex: SP01"
                  className="uppercase bg-white"
                />
                {form.formState.errors.siglaOrigem && <p className="text-xs text-red-500">{form.formState.errors.siglaOrigem.message}</p>}
              </div>
            </div>
          </div>

          {/* Destino */}
          <div className="p-3 rounded-lg border border-gray-200 space-y-3" style={{ backgroundColor: "#F0FBF8" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#2E9B7C" }}>CD Destino</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">CD *</Label>
                <Controller control={form.control} name="destino" render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => {
                    field.onChange(v);
                    const cd = centros.find((c) => c.codigo === v);
                    if (cd) form.setValue("siglaDestino", cd.codigo);
                  }}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {centros.map((c) => (
                        <SelectItem key={c.codigo} value={c.codigo}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {form.formState.errors.destino && <p className="text-xs text-red-500">{form.formState.errors.destino.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sigla *</Label>
                <Input
                  {...form.register("siglaDestino")}
                  placeholder="Ex: RJ01"
                  className="uppercase bg-white"
                />
                {form.formState.errors.siglaDestino && <p className="text-xs text-red-500">{form.formState.errors.siglaDestino.message}</p>}
              </div>
            </div>
          </div>

          {/* SLA dias + Liberado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">SLA (dias) *</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} {...form.register("sla")} />
                <span className="text-sm text-gray-500 shrink-0">dias</span>
              </div>
              {form.formState.errors.sla && <p className="text-xs text-red-500">{form.formState.errors.sla.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Transferência *</Label>
              <Controller control={form.control} name="liberado" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">✅ Liberada</SelectItem>
                    <SelectItem value="N">🚫 Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {form.formState.errors.liberado && <p className="text-xs text-red-500">{form.formState.errors.liberado.message}</p>}
            </div>
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
interface SlasCsvUploadModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function SlasCsvUploadModal({ open, onOpenChange, onSuccess }: SlasCsvUploadModalProps) {
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
      const json = await apiFetch<{ inserted: number; updated: number }>("/admin/slas/upload", { method: "POST", body: formData });
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
              Upload de SLAs (CSV)
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            Selecione um arquivo CSV (separador detectado automaticamente) com as colunas:{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">origem, destino, sla, liberado</code>.
            As colunas <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">siglaorigem</code> e{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">sigladestino</code> são opcionais (padrão: código do CD).
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
export function SlasSection() {
  const [slas, setSlas]             = useState<Sla[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sla | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sla | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: Sla[] }>("/admin/slas");
      setSlas(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = slas.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.origem.toLowerCase().includes(q) ||
      s.destino.toLowerCase().includes(q) ||
      s.siglaOrigem.toLowerCase().includes(q) ||
      s.siglaDestino.toLowerCase().includes(q)
    );
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/slas/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "SLA excluído!" });
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
            placeholder="Buscar por origem ou destino..."
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
            <Upload size={14} /> Upload CSV
          </Button>
          <Button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            style={{ backgroundColor: "#16455C", color: "white" }}
          >
            <Plus size={15} /> Novo SLA
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
            <Clock size={36} className="mb-3 opacity-30" />
            <p className="text-sm">{search ? "Nenhum SLA encontrado" : "Nenhum SLA cadastrado"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Origem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Sigla Origem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Destino</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Sigla Destino</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>SLA (dias)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Rota</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 text-xs">{s.origem}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "#16455C" }}>{s.siglaOrigem}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{s.destino}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "#2E9B7C" }}>{s.siglaDestino}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                        style={{ borderColor: "#7FD9CD", color: "#16455C", backgroundColor: "#EBF5F9" }}
                      >
                        <Clock size={10} /> {s.sla}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.liberado === "N" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border border-red-200 text-red-600 bg-red-50">
                          <XCircle size={10} /> Bloqueada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-200 text-emerald-700 bg-emerald-50">
                          <CheckCircle2 size={10} /> Liberada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-[#16455C] hover:bg-[#EBF5F9]"
                          onClick={() => { setEditTarget(s); setModalOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteTarget(s); setDeleteOpen(true); }}
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

      <p className="text-xs text-gray-400">{filtered.length} SLA(s)</p>

      <SlaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sla={editTarget}
        onSuccess={load}
      />

      <SlasCsvUploadModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        onSuccess={load}
      />

      {/* Confirmação exclusão */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) { setDeleteOpen(false); setDeleteTarget(null); } }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#16455C" }}>Excluir SLA</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Excluir o SLA de{" "}
            <strong>{deleteTarget?.siglaOrigem}</strong> → <strong>{deleteTarget?.siglaDestino}</strong>?
            Esta ação não pode ser desfeita.
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
