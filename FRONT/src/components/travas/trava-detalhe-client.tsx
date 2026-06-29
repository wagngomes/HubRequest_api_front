"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Send, CheckCircle2, XCircle,
  User, RefreshCw, Pencil, Trash2, Save, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

// ── Tipos ──────────────────────────────────────────────────────────────────
type AreaTrava   = "COMERCIAL" | "COMPRAS" | "PLANEJAMENTO" | "PRICING" | "FISCAL" | "OUTRAS";
type StatusTrava = "ATIVA" | "INATIVA";

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

interface MensagemUser {
  id: string; nome: string; email: string; setor: string;
}
interface Mensagem {
  id: string;
  texto: string;
  createdAt: string;
  user: MensagemUser;
}

// ── Paleta de área ─────────────────────────────────────────────────────────
const AREA_COLOR: Record<AreaTrava, string> = {
  COMERCIAL: "#16455C", COMPRAS: "#2E9B7C", PLANEJAMENTO: "#7C3AED",
  PRICING: "#B45309",   FISCAL: "#DC2626",  OUTRAS: "#6B7280",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}

function SetorBadge({ setor }: { setor: string }) {
  const map: Record<string, string> = {
    PLANEJAMENTO: "#7C3AED", COMERCIAL: "#16455C",
    OPERACOES: "#2E9B7C",   OUTRO: "#6B7280",
  };
  const color = map[setor] ?? "#6B7280";
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
          style={{ color, borderColor: color + "40", backgroundColor: color + "12" }}>
      {setor}
    </span>
  );
}

// ── Componente de detalhe ──────────────────────────────────────────────────
interface Props {
  id: string;
  userEmail: string;
  userRole: string;
}

export function TravaDetalheClient({ id, userEmail, userRole }: Props) {
  const router  = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);

  const [trava, setTrava]         = useState<Trava | null>(null);
  const [msgs, setMsgs]           = useState<Mensagem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [texto, setTexto]         = useState("");
  const [canEdit, setCanEdit]     = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  // ── Carregamento ──────────────────────────────────────────────────────────
  const loadTrava = useCallback(async () => {
    setLoading(true);
    try {
      const [travaJson, msgsJson] = await Promise.all([
        apiFetch<{ data: Trava }>(`/travas/${id}`),
        apiFetch<{ data: Mensagem[] }>(`/travas/${id}/mensagens`),
      ]);
      setTrava(travaJson.data);
      setMsgs(msgsJson.data ?? []);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar trava" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkPermission = useCallback(async () => {
    if (userRole === "ADMIN") { setCanEdit(true); return; }
    try {
      const json = await apiFetch<{ data: Record<string, string> }>("/admin/settings?key=travasEditores");
      const editores = (json.data?.travasEditores ?? "").split(";").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
      setCanEdit(editores.includes(userEmail.toLowerCase()));
    } catch { setCanEdit(false); }
  }, [userEmail, userRole]);

  useEffect(() => { loadTrava(); checkPermission(); }, [loadTrava, checkPermission]);

  // Scroll ao fundo do chat quando chegam mensagens
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  // ── Enviar mensagem ────────────────────────────────────────────────────────
  async function handleSend() {
    const t = texto.trim();
    if (!t) return;
    setSending(true);
    try {
      const json = await apiFetch<{ data: Mensagem }>(`/travas/${id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ texto: t }),
      });
      setMsgs((prev) => [...prev, json.data]);
      setTexto("");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setSending(false);
    }
  }

  // ── Excluir trava ──────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/travas/${id}`, { method: "DELETE" });
      toast({ title: "Trava excluída" });
      router.push("/travas");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: "#16455C" }} />
      </div>
    );
  }

  if (!trava) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Trava não encontrada</p>
        <Button variant="ghost" className="mt-3" onClick={() => router.push("/travas")}>Voltar</Button>
      </div>
    );
  }

  const areaColor = AREA_COLOR[trava.area];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Breadcrumb / Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/travas")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#16455C" }}>
              {trava.trava}
            </h1>
            {trava.nomeTrava && trava.nomeTrava !== trava.trava && (
              <p className="text-sm text-gray-500">{trava.nomeTrava}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trava.status === "ATIVA" ? (
            <Badge style={{ backgroundColor: "#D1FAE5", color: "#065F46", border: "none" }}>
              <CheckCircle2 size={11} className="mr-1" /> Ativa
            </Badge>
          ) : (
            <Badge style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "none" }}>
              <XCircle size={11} className="mr-1" /> Inativa
            </Badge>
          )}
          {canEdit && (
            <>
              <Button
                size="sm"
                className="gap-1"
                style={{ backgroundColor: "#7C3AED", color: "white" }}
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={13} /> Editar
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteOpen(true)}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Informações da trava ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card principal */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1" style={{ backgroundColor: areaColor }} />
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Área" value={trava.area} color={areaColor} />
                <InfoField label="Tipo" value={trava.transOuVenda} />
                <InfoField label="Sistema" value={trava.salesOuMoney} />
                <InfoField label="Solicitação" value={trava.solicitacao || "—"} />
                <InfoField label="Data Solicitação" value={trava.dataSolicitacao || "—"} />
                <InfoField label="Data Atualização" value={trava.dataAtualizacao || "—"} />
              </div>

              {trava.aprovadores.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Aprovadores</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trava.aprovadores.map((a) => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {trava.mensagemCustomizada && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Mensagem Customizada</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{trava.mensagemCustomizada}</p>
                </div>
              )}

              {trava.motivoDetalhamento && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Motivo / Detalhamento</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{trava.motivoDetalhamento}</p>
                </div>
              )}

              {trava.motivoAtualizacao && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Motivo da Atualização</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{trava.motivoAtualizacao}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Chat assíncrono ── */}
        <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 400 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold" style={{ color: "#16455C" }}>Mensagens</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadTrava}>
              <RefreshCw size={13} />
            </Button>
          </div>

          {/* Lista de mensagens */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 420 }}>
            {msgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <User size={24} className="mb-2 opacity-30" />
                <p className="text-xs">Nenhuma mensagem ainda</p>
              </div>
            ) : (
              msgs.map((m) => {
                const isMe = m.user.email === userEmail;
                return (
                  <div key={m.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-700">{m.user.nome}</span>
                      <SetorBadge setor={m.user.setor} />
                      <span className="text-[10px] text-gray-400">{fmtDate(m.createdAt)}</span>
                    </div>
                    <div
                      className={`max-w-[90%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${
                        isMe ? "rounded-tr-sm" : "rounded-tl-sm"
                      }`}
                      style={isMe
                        ? { backgroundColor: "#16455C", color: "white" }
                        : { backgroundColor: "#F3F4F6", color: "#374151" }
                      }
                    >
                      {m.texto}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input de mensagem */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sending || !texto.trim()}
                style={{ backgroundColor: "#16455C", color: "white" }}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal editar ── */}
      {canEdit && trava && (
        <EditModal
          trava={trava}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => { setEditOpen(false); loadTrava(); }}
        />
      )}

      {/* ── Confirmação exclusão ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: "#16455C" }}>Excluir trava</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Tem certeza que deseja excluir a trava <strong className="font-mono">{trava.trava}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" className="text-gray-700 border-gray-300" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: "#dc2626", color: "white" }}>
              {deleting && <Loader2 size={14} className="animate-spin" />} Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── InfoField ──────────────────────────────────────────────────────────────
function InfoField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium" style={{ color: color ?? "#374151" }}>{value || "—"}</p>
    </div>
  );
}

// ── Modal de Edição ────────────────────────────────────────────────────────
interface EditModalProps {
  trava: Trava;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function EditModal({ trava, open, onOpenChange, onSuccess }: EditModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    status:              trava.status,
    mensagemCustomizada: trava.mensagemCustomizada,
    motivoDetalhamento:  trava.motivoDetalhamento,
    motivoAtualizacao:   trava.motivoAtualizacao,
    dataAtualizacao:     trava.dataAtualizacao,
    aprovadores:         trava.aprovadores.join("; "),
  });

  useEffect(() => {
    if (open) setForm({
      status:              trava.status,
      mensagemCustomizada: trava.mensagemCustomizada,
      motivoDetalhamento:  trava.motivoDetalhamento,
      motivoAtualizacao:   trava.motivoAtualizacao,
      dataAtualizacao:     trava.dataAtualizacao,
      aprovadores:         trava.aprovadores.join("; "),
    });
  }, [open, trava]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch(`/travas/${trava.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          aprovadores: form.aprovadores.split(";").map((a) => a.trim()).filter(Boolean),
        }),
      });
      toast({ title: "Trava atualizada!" });
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#7C3AED" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              Editar Trava
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</Label>
            <div className="flex gap-2">
              {(["ATIVA", "INATIVA"] as StatusTrava[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={form.status === s
                    ? { backgroundColor: s === "ATIVA" ? "#D1FAE5" : "#FEE2E2", color: s === "ATIVA" ? "#065F46" : "#991B1B", borderColor: s === "ATIVA" ? "#6EE7B7" : "#FCA5A5" }
                    : { backgroundColor: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <EditField label="Mensagem Customizada" value={form.mensagemCustomizada} multiline
            onChange={(v) => setForm((f) => ({ ...f, mensagemCustomizada: v }))} />
          <EditField label="Motivo / Detalhamento" value={form.motivoDetalhamento} multiline
            onChange={(v) => setForm((f) => ({ ...f, motivoDetalhamento: v }))} />
          <EditField label="Motivo da Atualização" value={form.motivoAtualizacao} multiline
            onChange={(v) => setForm((f) => ({ ...f, motivoAtualizacao: v }))} />
          <EditField label="Data da Atualização" value={form.dataAtualizacao}
            onChange={(v) => setForm((f) => ({ ...f, dataAtualizacao: v }))} />
          <EditField label="Aprovadores (separados por ;)" value={form.aprovadores}
            onChange={(v) => setForm((f) => ({ ...f, aprovadores: v }))} />

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X size={13} /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#7C3AED", color: "white" }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditField({ label, value, onChange, multiline }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</Label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  );
}
