"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, ChevronDown, ChevronRight, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";

interface AuditLog {
  id: string;
  userId: string;
  userNome: string;
  userEmail: string;
  userSetor: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  ip: string | null;
  createdAt: string;
}

interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

const SETOR_LABELS: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  COMERCIAL: "Comercial",
  OPERACOES: "Operações",
  OUTRO: "Outro",
};

const ENTITY_OPTIONS = [
  { value: "", label: "Todas as entidades" },
  { value: "Trava", label: "Travas" },
  { value: "TravaMensagem", label: "Mensagens de Trava" },
  { value: "SolicitacaoLiberacao", label: "Liberações (solicitação)" },
  { value: "LiberacaoItem", label: "Liberações (item)" },
  { value: "SolicitacaoTransferencia", label: "Transferências (solicitação)" },
  { value: "TransferenciaItem", label: "Transferências (item)" },
];

const ACTION_OPTIONS = [
  { value: "", label: "Todas as ações" },
  { value: "CREATE", label: "Criação" },
  { value: "UPDATE", label: "Edição" },
  { value: "DELETE", label: "Exclusão" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

function ChangesPanel({ changes }: { changes: Record<string, { from: unknown; to: unknown }> | null }) {
  if (!changes) return <p className="text-xs text-gray-500 italic">Sem dados de alteração</p>;

  const entries = Object.entries(changes);
  if (entries.length === 0) return <p className="text-xs text-gray-500 italic">Sem alterações registradas</p>;

  if ("snapshot" in changes) {
    const snap = changes.snapshot;
    const value = snap.to !== null ? snap.to : snap.from;
    return (
      <div className="text-xs">
        <p className="text-gray-500 mb-1 font-medium">Snapshot da entidade:</p>
        <pre className="bg-gray-50 rounded p-2 text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([field, { from, to }]) => (
        <div key={field} className="flex gap-3 text-xs">
          <span className="font-medium text-gray-600 w-36 shrink-0">{field}</span>
          <span className="text-red-600 line-through max-w-50 truncate" title={formatValue(from)}>
            {formatValue(from)}
          </span>
          <span className="text-gray-400">→</span>
          <span className="text-green-700 max-w-50 truncate" title={formatValue(to)}>
            {formatValue(to)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
          {formatDateTime(log.createdAt)}
        </td>
        <td className="px-3 py-3">
          <p className="text-sm font-medium text-gray-800">{log.userNome}</p>
          <p className="text-xs text-gray-400">{log.userEmail}</p>
        </td>
        <td className="px-3 py-3 text-xs text-gray-600">
          {SETOR_LABELS[log.userSetor] ?? log.userSetor}
        </td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action]}`}>
            {ACTION_LABELS[log.action] ?? log.action}
          </span>
        </td>
        <td className="px-3 py-3 text-xs text-gray-700">{log.entity}</td>
        <td className="px-3 py-3 text-xs text-gray-400 font-mono max-w-30 truncate" title={log.entityId}>
          {log.entityId}
        </td>
        <td className="px-3 py-3 text-gray-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={7} className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detalhes da alteração</p>
            <ChangesPanel changes={log.changes} />
            {log.ip && (
              <p className="text-xs text-gray-400 mt-2">IP: {log.ip}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function MonitoringSection({ isAdmin: _isAdmin }: { isAdmin: boolean }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const LIMIT = 20;
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL ?? "";

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (filterEntity) params.set("entity", filterEntity);
      if (filterAction) params.set("action", filterAction);
      if (filterFrom)   params.set("from", new Date(filterFrom).toISOString());
      if (filterTo)     params.set("to",   new Date(filterTo + "T23:59:59").toISOString());

      const res = await apiFetch<AuditResponse>(`/admin/audit?${params}`);
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
      setError("Não foi possível carregar os registros.");
    } finally {
      setLoading(false);
    }
  }, [filterEntity, filterAction, filterFrom, filterTo]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} style={{ color: "#16455C" }} />
          <h2 className="text-base font-semibold" style={{ color: "#16455C" }}>Trilha de Auditoria</h2>
        </div>
        <div className="flex items-center gap-2">
          {grafanaUrl && (
            <a
              href={grafanaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1.5 transition-colors"
            >
              <ExternalLink size={12} /> Grafana
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="gap-1.5 text-xs text-gray-700 border-gray-300"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterEntity} onValueChange={(v) => setFilterEntity(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 text-sm text-gray-900">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAction} onValueChange={(v) => setFilterAction(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 text-sm text-gray-900">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="text-sm text-gray-900 w-36"
            placeholder="De"
          />
          <span className="text-gray-400 text-xs">até</span>
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="text-sm text-gray-900 w-36"
            placeholder="Até"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {error && (
          <p className="text-sm text-red-500 px-4 py-3">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Data/Hora</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Setor</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ação</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entidade</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Carregando...</td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
              {!loading && logs.map((log) => <AuditRow key={log.id} log={log} />)}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="text-xs text-gray-700 border-gray-300"
              >
                Anterior
              </Button>
              <span className="px-3 text-xs text-gray-600">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
                className="text-xs text-gray-700 border-gray-300"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
