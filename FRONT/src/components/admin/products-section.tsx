"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Trash2, Loader2, Search, X,
  Upload, Package, CheckCircle2,
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
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { adminProductSchema } from "@/lib/validations/admin";
import type { AdminProductInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";

interface AdminProduct {
  codigo:      string;
  descricao:   string;
  marca:       string;
  refrigerado: string;
  controlado:  string;
  cmv:         number;
  tributacao:  string;
  multiplo:    number;
}

/* ── Modal criar / editar ─────────────────────────────────────────────── */
interface ProductModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: AdminProduct | null;
  onSuccess: () => void;
}

function ProductModal({ open, onOpenChange, product, onSuccess }: ProductModalProps) {
  const isEdit = !!product;
  const [isLoading, setIsLoading] = useState(false);

  const EMPTY: AdminProductInput = {
    codigo: "", descricao: "", marca: "", refrigerado: "N", controlado: "N",
    cmv: 0, tributacao: "-", multiplo: 1,
  };

  const form = useForm<AdminProductInput>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) { form.reset(EMPTY); return; }
    if (product) {
      form.reset({
        codigo:      product.codigo,
        descricao:   product.descricao,
        marca:       product.marca,
        refrigerado: product.refrigerado as "S" | "N",
        controlado:  product.controlado  as "S" | "N",
        cmv:         product.cmv,
        tributacao:  product.tributacao  ?? "-",
        multiplo:    product.multiplo    ?? 1,
      });
    } else {
      form.reset(EMPTY);
    }
  }, [open, product]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: AdminProductInput) {
    setIsLoading(true);
    try {
      const path   = isEdit ? `/admin/products/${product!.codigo}` : "/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      await apiFetch(path, { method, body: JSON.stringify(data) });
      toast({ title: isEdit ? "Produto atualizado!" : "Produto criado!" });
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
              {isEdit ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código *</Label>
              <Input
                {...form.register("codigo")}
                className="font-mono uppercase"
                readOnly={isEdit}
                disabled={isEdit}
              />
              {form.formState.errors.codigo && <p className="text-xs text-red-500">{form.formState.errors.codigo.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Marca *</Label>
              <Input {...form.register("marca")} />
              {form.formState.errors.marca && <p className="text-xs text-red-500">{form.formState.errors.marca.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Descrição *</Label>
            <Input {...form.register("descricao")} />
            {form.formState.errors.descricao && <p className="text-xs text-red-500">{form.formState.errors.descricao.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">❄ Refrigerado</Label>
              <Controller control={form.control} name="refrigerado" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Sim</SelectItem>
                    <SelectItem value="N">Não</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">⚠ Controlado</Label>
              <Controller control={form.control} name="controlado" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Sim</SelectItem>
                    <SelectItem value="N">Não</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">CMV (R$)</Label>
              <Input type="number" step="0.01" min="0" {...form.register("cmv")} />
              {form.formState.errors.cmv && <p className="text-xs text-red-500">{form.formState.errors.cmv.message}</p>}
            </div>
          </div>
          {/* Tributação + Múltiplo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tributação</Label>
              <Input {...form.register("tributacao")} placeholder="-" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Múltiplo</Label>
              <Input type="number" min="1" step="1" {...form.register("multiplo")} />
              {form.formState.errors.multiplo && <p className="text-xs text-red-500">{form.formState.errors.multiplo.message}</p>}
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
interface CsvUploadModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function CsvUploadModal({ open, onOpenChange, onSuccess }: CsvUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setResult(null); }
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    /*
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        try {
          const res = await fetch("/api/produtos/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: parsed.data }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Erro no upload");
          setResult({ inserted: json.inserted ?? 0, updated: json.updated ?? 0 });
          onSuccess();
        } catch (err) {
          toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
        } finally {
          setUploading(false);
          if (fileRef.current) fileRef.current.value = "";
        }
      },
      error: () => {
        toast({ variant: "destructive", title: "Erro ao processar CSV" });
        setUploading(false);
      },
    });*/


      try {
    const formData = new FormData();

    formData.append("file", file);

    const json = await apiFetch<{ inserted: number; updated: number }>("/admin/products/upload", {
      method: "POST",
      body: formData,
    });

    setResult({
      inserted: json.inserted ?? 0,
      updated: json.updated ?? 0,
    });

    onSuccess();

  } catch (err) {
    toast({
      variant: "destructive",
      title: "Erro",
      description: err instanceof Error ? err.message : "",
    });

  } finally {
    setUploading(false);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#2E9B7C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Upload de Produtos (CSV)
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            Selecione um arquivo CSV com os campos: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">codigo, descricao, marca, refrigerado, controlado, cmv, tributacao, multiplo</code>.
            Os registros existentes serão atualizados. Supridor é gerenciado na aba &quot;Supridores&quot;.
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
export function ProductsSection() {
  const [products, setProducts]     = useState<AdminProduct[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen]   = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [clearOpen, setClearOpen]   = useState(false);
  const [clearing, setClearing]     = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), search: s });
      const json = await apiFetch<{ data: AdminProduct[]; total: number; totalPages: number }>(`/admin/products?${params}`);
      setProducts(json.data ?? []);
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
      await apiFetch(`/admin/products/${deleteTarget.codigo}`, { method: "DELETE" });
      toast({ title: "Produto excluído!" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      load(page, search);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setDeleting(false);
    }
  }

  async function handleClear() {
    setClearing(true);
    try {
      const json = await apiFetch<{ message?: string }>("/admin/products/clear", { method: "DELETE" });
      toast({ title: json.message ?? "Tabela limpa com sucesso!" });
      setClearOpen(false);
      setPage(1);
      load(1, search);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Código, descrição ou marca..."
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
            onClick={() => setCsvModalOpen(true)}
            className="gap-2 border-[#16455C] text-[#16455C] hover:bg-[#EBF5F9] hover:text-[#16455C]"
          >
            <Upload size={14} /> Upload CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setClearOpen(true)}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={14} /> Limpar tabela
          </Button>
          <Button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            style={{ backgroundColor: "#16455C", color: "white" }}
          >
            <Plus size={15} /> Novo produto
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Package size={36} className="mb-3 opacity-30" />
            <p className="text-sm">{search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Marca</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Tributação</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Múlt.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Refrig.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Contr.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>CMV</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.codigo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "#16455C" }}>{p.codigo}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{p.descricao}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.marca}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.tributacao ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs text-center">{p.multiplo ?? 1}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                        style={p.refrigerado === "S"
                          ? { borderColor: "#3b82f6", color: "#3b82f6", backgroundColor: "#eff6ff" }
                          : { borderColor: "#d1d5db", color: "#9ca3af" }
                        }
                      >
                        {p.refrigerado === "S" ? "❄ Sim" : "Não"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                        style={p.controlado === "S"
                          ? { borderColor: "#f59e0b", color: "#b45309", backgroundColor: "#fffbeb" }
                          : { borderColor: "#d1d5db", color: "#9ca3af" }
                        }
                      >
                        {p.controlado === "S" ? "⚠ Sim" : "Não"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {p.cmv > 0 ? `R$ ${p.cmv.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-[#16455C] hover:bg-[#EBF5F9]"
                          onClick={() => { setEditTarget(p); setModalOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteTarget(p); setDeleteOpen(true); }}
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

      {/* Paginação + total */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{total} produto(s)</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 px-2 text-xs"
            >
              Anterior
            </Button>
            <span className="text-xs text-gray-500 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 text-xs"
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Modais */}
      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editTarget}
        onSuccess={() => load(page, search)}
      />

      <CsvUploadModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        onSuccess={() => load(page, search)}
      />

      {/* Confirmação exclusão */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) { setDeleteOpen(false); setDeleteTarget(null); } }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#16455C" }}>Excluir produto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Tem certeza que deseja excluir o produto{" "}
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

      {/* Confirmação limpar tabela */}
      <Dialog open={clearOpen} onOpenChange={(v) => { if (!v) setClearOpen(false); }}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#dc2626" }}>Limpar tabela de produtos</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-600">
              Todos os produtos <strong>que não estão em uso</strong> em transferências ou liberações serão
              permanentemente excluídos. Esta ação não pode ser desfeita.
            </p>
            <div
              className="flex items-start gap-2 p-3 rounded-lg border text-xs text-amber-800"
              style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
            >
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>Produtos vinculados a solicitações abertas serão mantidos automaticamente.</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => setClearOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleClear}
              disabled={clearing}
              style={{ backgroundColor: "#dc2626", color: "white" }}
            >
              {clearing && <Loader2 size={14} className="animate-spin" />} Limpar tabela
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
