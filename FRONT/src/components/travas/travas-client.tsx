"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, ShoppingBag, Package, BarChart2, Tag, FileText,
  MoreHorizontal, Upload, Plus, CheckCircle2, XCircle,
  ExternalLink, Search, X, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

// ── Tipos ──────────────────────────────────────────────────────────────────
type AreaTrava   = "COMERCIAL" | "COMPRAS" | "PLANEJAMENTO" | "PRICING" | "FISCAL" | "OUTRAS";
type StatusTrava = "ATIVA" | "INATIVA";

interface AreaCount { area: AreaTrava; total: number }

interface Trava {
  id: string;
  trava: string;
  nomeTrava: string;
  area: AreaTrava;
  status: StatusTrava;
  mensagemCustomizada: string;
  motivoDetalhamento: string;
  solicitacao: string;
  aprovadores: string[];
  transOuVenda: string;
  salesOuMoney: string;
  dataSolicitacao: string;
  dataAtualizacao: string;
  motivoAtualizacao: string;
  createdAt: string;
  updatedAt: string;
}

// ── Config por área ────────────────────────────────────────────────────────
const AREA_CONFIG: Record<AreaTrava, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  COMERCIAL:    { label: "Comercial",    color: "#16455C", bg: "#EBF5F9", icon: ShoppingBag },
  COMPRAS:      { label: "Compras",      color: "#2E9B7C", bg: "#E8F5F1", icon: Package     },
  PLANEJAMENTO: { label: "Planejamento", color: "#7C3AED", bg: "#F3EFFF", icon: BarChart2   },
  PRICING:      { label: "Pricing",      color: "#B45309", bg: "#FEF3C7", icon: Tag         },
  FISCAL:       { label: "Fiscal",       color: "#DC2626", bg: "#FEE2E2", icon: FileText    },
  OUTRAS:       { label: "Outras",       color: "#6B7280", bg: "#F3F4F6", icon: MoreHorizontal },
};

// ── Badge status ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusTrava }) {
  return status === "ATIVA" ? (
    <Badge className="gap-1 text-xs" style={{ backgroundColor: "#D1FAE5", color: "#065F46", border: "none" }}>
      <CheckCircle2 size={10} /> Ativa
    </Badge>
  ) : (
    <Badge className="gap-1 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "none" }}>
      <XCircle size={10} /> Inativa
    </Badge>
  );
}

// ── Modal lista de travas de uma área ──────────────────────────────────────
interface AreaModalProps {
  area: AreaTrava;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function AreaModal({ area, open, onOpenChange }: AreaModalProps) {
  const router = useRouter();
  const cfg = AREA_CONFIG[area];
  const Icon = cfg.icon;
  const [travas, setTravas]   = useState<Trava[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const json = await apiFetch<{ data: Trava[]; total: number }>(`/travas?area=${area}&limit=100`);
      setTravas(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [open, area]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!open) setSearch(""); }, [open]);

  const filtered = travas.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.trava.toLowerCase().includes(q) ||
      t.nomeTrava.toLowerCase().includes(q) ||
      t.mensagemCustomizada.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
              <Icon size={16} style={{ color: cfg.color }} />
            </div>
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Travas — {cfg.label}
            </DialogTitle>
          </div>
          <div className="relative mt-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar trava..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin" style={{ color: cfg.color }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Lock size={28} className="mb-2 opacity-30" />
              <p className="text-sm">{search ? "Nenhuma trava encontrada" : "Nenhuma trava nesta área"}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 sticky top-0 bg-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Nome da Trava</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Mensagem</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-xs" style={{ color: cfg.color }}>{t.trava}</p>
                      {t.nomeTrava && t.nomeTrava !== t.trava && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-45">{t.nomeTrava}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600 line-clamp-2 max-w-70">{t.mensagemCustomizada || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        style={{ color: cfg.color }}
                        onClick={() => { onOpenChange(false); router.push(`/travas/${t.id}`); }}
                      >
                        <ExternalLink size={12} /> Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="pt-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400">{filtered.length} trava(s)</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal upload CSV ───────────────────────────────────────────────────────
interface CsvUploadModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function CsvUploadModal({ open, onOpenChange, onSuccess }: CsvUploadModalProps) {
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
      const json = await apiFetch<{ inserted: number; updated: number }>("/travas/upload", { method: "POST", body: formData });
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
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#7C3AED" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Upload de Travas (CSV)
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            CSV com separador detectado automaticamente. Colunas:{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">trava, area, solicitacao, aprovadores, status, nome_trava, mensagem_customizada, motivo_detalhamento, data_solicitacao, trans_ou_venda, sales_ou_money</code>.
          </p>
          {result ? (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3EFFF" }}>
                <CheckCircle2 size={24} style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Upload concluído!</p>
                <p className="text-sm text-gray-500 mt-1">{result.inserted} inserido(s) · {result.updated} atualizado(s)</p>
              </div>
              <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: "#7C3AED", color: "white" }}>Fechar</Button>
            </div>
          ) : (
            <>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-[#7C3AED] hover:bg-[#F3EFFF]" style={{ borderColor: "#d1d5db" }}>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={uploading} />
                {uploading ? <Loader2 size={28} className="animate-spin mb-2" style={{ color: "#7C3AED" }} /> : <Upload size={28} className="mb-2 text-gray-300" />}
                <p className="text-sm text-gray-400">{uploading ? "Processando..." : "Clique para selecionar o arquivo CSV"}</p>
              </label>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal nova trava ──────────────────────────────────────────────────────
interface NovaTravaModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

const AREA_OPTIONS: { value: AreaTrava; label: string }[] = [
  { value: "COMERCIAL",    label: "Comercial" },
  { value: "COMPRAS",      label: "Compras" },
  { value: "PLANEJAMENTO", label: "Planejamento" },
  { value: "PRICING",      label: "Pricing" },
  { value: "FISCAL",       label: "Fiscal" },
  { value: "OUTRAS",       label: "Outras" },
];

interface NovaTravaForm {
  trava: string;
  area: AreaTrava;
  nomeTrava: string;
  status: StatusTrava;
  transOuVenda: "TRANSF" | "VENDA";
  salesOuMoney: "MONEY" | "SALESFORCE" | "MONEY_SALESFORCE";
  solicitacao: string;
  aprovadores: string;
  mensagemCustomizada: string;
  motivoDetalhamento: string;
  dataSolicitacao: string;
}

const EMPTY_FORM: NovaTravaForm = {
  trava: "",
  area: "COMERCIAL",
  nomeTrava: "",
  status: "ATIVA",
  transOuVenda: "VENDA",
  salesOuMoney: "MONEY_SALESFORCE",
  solicitacao: "",
  aprovadores: "",
  mensagemCustomizada: "",
  motivoDetalhamento: "",
  dataSolicitacao: "",
};

function NovaTravaModal({ open, onOpenChange, onSuccess }: NovaTravaModalProps) {
  const [form, setForm]     = useState<NovaTravaForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!open) setForm(EMPTY_FORM); }, [open]);

  function set<K extends keyof NovaTravaForm>(key: K, value: NovaTravaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.trava.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/travas", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          aprovadores: form.aprovadores.split(/[;,\n]+/).map((s) => s.trim()).filter(Boolean),
        }),
      });
      toast({ title: "Trava criada com sucesso!" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setSaving(false);
    }
  }

  const textareaClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]";
  const selectClass   = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] bg-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#7C3AED" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Nova Trava
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Código + Área */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código da Trava *</Label>
              <Input
                placeholder="Ex: ZT001"
                value={form.trava}
                onChange={(e) => set("trava", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Área *</Label>
              <select className={selectClass} value={form.area} onChange={(e) => set("area", e.target.value as AreaTrava)}>
                {AREA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Nome da Trava */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nome da Trava</Label>
            <Input
              placeholder="Nome descritivo da trava"
              value={form.nomeTrava}
              onChange={(e) => set("nomeTrava", e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Status toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</Label>
            <div className="flex gap-2">
              {(["ATIVA", "INATIVA"] as StatusTrava[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={form.status === s
                    ? { backgroundColor: s === "ATIVA" ? "#D1FAE5" : "#FEE2E2", color: s === "ATIVA" ? "#065F46" : "#991B1B", borderColor: s === "ATIVA" ? "#6EE7B7" : "#FCA5A5" }
                    : { backgroundColor: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}
                >
                  {s === "ATIVA" ? "Ativa" : "Inativa"}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo + Sistema */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</Label>
              <select className={selectClass} value={form.transOuVenda} onChange={(e) => set("transOuVenda", e.target.value as "TRANSF" | "VENDA")}>
                <option value="VENDA">Venda</option>
                <option value="TRANSF">Transferência</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sistema</Label>
              <select className={selectClass} value={form.salesOuMoney} onChange={(e) => set("salesOuMoney", e.target.value as "MONEY" | "SALESFORCE" | "MONEY_SALESFORCE")}>
                <option value="MONEY_SALESFORCE">Money + Salesforce</option>
                <option value="MONEY">Money</option>
                <option value="SALESFORCE">Salesforce</option>
              </select>
            </div>
          </div>

          {/* Solicitação + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solicitação</Label>
              <Input
                placeholder="Nº ou descrição"
                value={form.solicitacao}
                onChange={(e) => set("solicitacao", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Data da Solicitação</Label>
              <Input
                placeholder="DD/MM/AAAA"
                value={form.dataSolicitacao}
                onChange={(e) => set("dataSolicitacao", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Aprovadores */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aprovadores (separados por ;)</Label>
            <textarea
              className={textareaClass}
              rows={2}
              placeholder="nome1; nome2; nome3"
              value={form.aprovadores}
              onChange={(e) => set("aprovadores", e.target.value)}
            />
          </div>

          {/* Mensagem Customizada */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mensagem Customizada</Label>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Mensagem exibida quando a trava é acionada"
              value={form.mensagemCustomizada}
              onChange={(e) => set("mensagemCustomizada", e.target.value)}
            />
          </div>

          {/* Motivo / Detalhamento */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Motivo / Detalhamento</Label>
            <textarea
              className={textareaClass}
              rows={2}
              placeholder="Detalhamento adicional da trava"
              value={form.motivoDetalhamento}
              onChange={(e) => set("motivoDetalhamento", e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.trava.trim()}
              style={{ backgroundColor: "#7C3AED", color: "white" }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null} Criar Trava
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
interface TravasClientProps {
  userEmail: string;
  userRole: string;
}

export function TravasClient({ userEmail, userRole }: TravasClientProps) {
  const [areas, setAreas]               = useState<AreaCount[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedArea, setSelectedArea] = useState<AreaTrava | null>(null);
  const [csvOpen, setCsvOpen]           = useState(false);
  const [novaTravaOpen, setNovaTravaOpen] = useState(false);
  const [canEdit, setCanEdit]           = useState(false);

  const loadAreas = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: AreaCount[] }>("/travas/areas");
      setAreas(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verifica se usuário pode editar (ADMIN ou travasEditores)
  const checkPermission = useCallback(async () => {
    if (userRole === "ADMIN") { setCanEdit(true); return; }
    try {
      const json = await apiFetch<{ data: Record<string, string> }>("/admin/settings?key=travasEditores");
      const editores = (json.data?.travasEditores ?? "").split(";").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
      setCanEdit(editores.includes(userEmail.toLowerCase()));
    } catch {
      setCanEdit(false);
    }
  }, [userEmail, userRole]);

  useEffect(() => { loadAreas(); checkPermission(); }, [loadAreas, checkPermission]);

  const AREAS: AreaTrava[] = ["COMERCIAL", "COMPRAS", "PLANEJAMENTO", "PRICING", "FISCAL", "OUTRAS"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#16455C" }}>Travas | Regras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie as travas e regras do planejamento por área</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCsvOpen(true)} style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
              <Upload size={15} /> Upload CSV
            </Button>
            <Button onClick={() => setNovaTravaOpen(true)} style={{ backgroundColor: "#7C3AED", color: "white" }}>
              <Plus size={15} /> Nova Trava
            </Button>
          </div>
        )}
      </div>

      {/* Cards por área */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin" style={{ color: "#16455C" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map((area) => {
            const cfg  = AREA_CONFIG[area];
            const Icon = cfg.icon;
            const count = areas.find((a) => a.area === area)?.total ?? 0;
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className="text-left p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: cfg.color }}
                  >
                    {count}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#16455C" }}>{cfg.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{count === 1 ? "1 trava" : `${count} travas`} · clique para ver</p>
                <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
                  <div className="h-1 rounded-full transition-all group-hover:opacity-80" style={{ backgroundColor: cfg.color, width: count > 0 ? "100%" : "0%" }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal área */}
      {selectedArea && (
        <AreaModal
          area={selectedArea}
          open={!!selectedArea}
          onOpenChange={(v) => { if (!v) setSelectedArea(null); }}
        />
      )}

      {/* Modal CSV upload */}
      <CsvUploadModal open={csvOpen} onOpenChange={setCsvOpen} onSuccess={loadAreas} />

      {/* Modal nova trava */}
      <NovaTravaModal open={novaTravaOpen} onOpenChange={setNovaTravaOpen} onSuccess={loadAreas} />
    </div>
  );
}
