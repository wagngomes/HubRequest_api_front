"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Mail, Plus, X, AlertCircle, CheckCircle2, Truck, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailKey = "notificationEmailsTransferencia" | "notificationEmailsLiberacao" | "travasEditores";

interface EmailGroupEditorProps {
  title: string;
  description: string;
  settingsKey: EmailKey;
  accentColor: string;
  icon: React.ElementType;
}

function EmailGroupEditor({
  title, description, settingsKey, accentColor, icon: Icon,
}: EmailGroupEditorProps) {
  const [raw, setRaw]             = useState("");
  const [emails, setEmails]       = useState<string[]>([]);
  const [novoEmail, setNovoEmail] = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [inputError, setInputError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: Record<string, string> }>(`/admin/settings?key=${settingsKey}`);
      const value: string = json.data?.[settingsKey] ?? "";
      setRaw(value);
      setEmails(value ? value.split(";").map((e: string) => e.trim()).filter(Boolean) : []);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar configurações" });
    } finally {
      setLoading(false);
    }
  }, [settingsKey]);

  useEffect(() => { load(); }, [load]);

  function handleAddEmail() {
    const email = novoEmail.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) { setInputError("E-mail inválido"); return; }
    if (emails.includes(email))  { setInputError("Este e-mail já está na lista"); return; }
    const updated = [...emails, email];
    setEmails(updated);
    setRaw(updated.join(";"));
    setNovoEmail("");
    setInputError("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); handleAddEmail(); }
  }

  function handleRemoveEmail(email: string) {
    const updated = emails.filter((e) => e !== email);
    setEmails(updated);
    setRaw(updated.join(";"));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const json = await apiFetch<{ data: Record<string, string> }>("/admin/settings", {
        method: "PATCH",
        body:   JSON.stringify({ [settingsKey]: raw }),
      });

      const normalized: string = json.data?.[settingsKey] ?? "";
      setRaw(normalized);
      setEmails(normalized ? normalized.split(";").map((e: string) => e.trim()).filter(Boolean) : []);
      toast({ title: "Configurações salvas!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-28 rounded-xl border border-gray-200">
        <Loader2 size={22} className="animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5 rounded-xl border border-gray-200 bg-white">
      {/* Cabeçalho do grupo */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColor + "18" }}
        >
          <Icon size={17} style={{ color: accentColor }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#16455C" }}>{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border"
          style={emails.length > 0
            ? { backgroundColor: accentColor + "15", color: accentColor, borderColor: accentColor + "40" }
            : { backgroundColor: "#F5F5F5", color: "#9CA3AF", borderColor: "#E5E7EB" }
          }
        >
          {emails.length} e-mail{emails.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Adicionar e-mail */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Adicionar e-mail</Label>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Input
              type="email"
              placeholder="nome@empresa.com"
              value={novoEmail}
              onChange={(e) => { setNovoEmail(e.target.value); setInputError(""); }}
              onKeyDown={handleKeyDown}
              className={inputError ? "border-red-400 focus-visible:ring-red-300" : ""}
            />
            {inputError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {inputError}
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAddEmail}
            style={{ backgroundColor: accentColor, color: "white" }}
          >
            <Plus size={15} /> Adicionar
          </Button>
        </div>
      </div>

      {/* Lista de e-mails */}
      <div className="rounded-xl border border-gray-200 overflow-hidden min-h-16">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-16 text-gray-400">
            <Mail size={18} className="mb-1 opacity-30" />
            <p className="text-xs">Nenhum e-mail cadastrado</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 bg-white">
            {emails.map((email) => (
              <li key={email} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: accentColor }} />
                  <span className="text-sm text-gray-700">{email}</span>
                </div>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded"
                  title="Remover"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cole vários */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Ou cole vários separados por <code className="font-mono">;</code>
        </Label>
        <textarea
          className="w-full min-h-16 rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:border-[#16455C]"
          style={{ focusRingColor: accentColor } as React.CSSProperties}
          placeholder="email1@empresa.com;email2@empresa.com"
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setEmails(e.target.value.split(";").map((v) => v.trim()).filter(Boolean));
          }}
        />
      </div>

      {/* Salvar */}
      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: accentColor, color: "white" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

/* ── Seção principal ──────────────────────────────────────────────────── */
export function NotificacoesSection() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Descrição */}
      <div
        className="flex gap-3 p-4 rounded-xl border"
        style={{ backgroundColor: "#EBF5F9", borderColor: "#b8d9e8" }}
      >
        <Mail size={18} className="shrink-0 mt-0.5" style={{ color: "#16455C" }} />
        <p className="text-sm text-gray-700">
          Configure os e-mails que receberão notificações por tipo de solicitação.
          Os grupos podem ser diferentes — por exemplo, logística para transferências e
          faturamento para liberações.
        </p>
      </div>

      <EmailGroupEditor
        title="Notificações — Transferências"
        description="Receberão e-mail ao abrir nova solicitação de transferência"
        settingsKey="notificationEmailsTransferencia"
        accentColor="#16455C"
        icon={Truck}
      />

      <EmailGroupEditor
        title="Notificações — Liberação Pitágoras"
        description="Receberão e-mail ao abrir nova solicitação de liberação"
        settingsKey="notificationEmailsLiberacao"
        accentColor="#2E9B7C"
        icon={FileText}
      />

      <EmailGroupEditor
        title="Editores de Travas"
        description="Estes e-mails poderão criar, editar e excluir travas/regras. Demais usuários só podem visualizar e enviar mensagens."
        settingsKey="travasEditores"
        accentColor="#7C3AED"
        icon={Lock}
      />
    </div>
  );
}
