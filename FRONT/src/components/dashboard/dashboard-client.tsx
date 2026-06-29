"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { Loader2, Clock, ArrowLeftRight, FileText, TrendingUp, BarChart2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatBusinessHours } from "@/lib/business-hours";
import { apiFetch } from "@/lib/api-client";

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  petrol:  "#16455C",
  turq:    "#7FD9CD",
  green:   "#2E9B7C",
  gray:    "#F5F5F5",
  text:    "#2B2B2B",
  border:  "#E5E7EB",
  muted:   "#90AFC5",
};

// ── Tipos ───────────────────────────────────────────────────────────────────
interface DashboardData {
  periodo: { mes: number; ano: number };
  transferencias: {
    pendentes: number; processadas: number; naoProcessadas: number; total: number;
    tempoMedioHoras: number | null;
    porRota: { origem: string; destino: string; pendentes: number; processadas: number; total: number }[];
  };
  liberacoes: {
    pendentes: number; processadas: number; total: number;
    tempoMedioHoras: number | null;
  };
  porSupridor: { supridor: string; total: number; tempoMedioHoras: number | null }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function kpiPct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

// ── Tooltip customizado ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1" style={{ color: C.petrol }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill ?? p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
  pendentes?: number;
  processadas?: number;
  total?: number;
}

function KpiCard({ icon, label, value, sub, accentColor, pendentes, processadas, total }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${accentColor}18` }}>
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: C.gray, color: C.muted }}>
            {label}
          </span>
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight" style={{ color: C.petrol }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>}
        </div>

        {total !== undefined && total > 0 && (
          <div className="space-y-1.5 mt-auto">
            {/* bar pendentes / processadas */}
            <div className="flex rounded-full overflow-hidden h-2 bg-gray-100">
              <div
                className="transition-all duration-500"
                style={{ width: kpiPct(pendentes ?? 0, total), backgroundColor: C.turq }}
              />
              <div
                className="transition-all duration-500"
                style={{ width: kpiPct(processadas ?? 0, total), backgroundColor: C.petrol }}
              />
            </div>
            <div className="flex justify-between text-[11px]" style={{ color: C.muted }}>
              <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: C.turq }} />{pendentes} pendente(s)</span>
              <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: C.petrol }} />{processadas} processada(s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function DashboardClient({ isPlanejamento }: { isPlanejamento: boolean }) {
  const now = new Date();
  const [mes,  setMes]  = useState(String(now.getMonth() + 1));
  const [ano,  setAno]  = useState(String(now.getFullYear()));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const anos = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<DashboardData>(`/dashboard?mes=${mes}&ano=${ano}`);
      setData(json);
    } catch {
      // mantém dados anteriores em caso de erro
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Dados para gráfico de rosca (transferências) ─────────────────────────
  const pieTransf = data ? [
    { name: "Pendentes",  value: data.transferencias.pendentes,  fill: C.turq },
    { name: "Processadas",value: data.transferencias.processadas, fill: C.petrol },
  ] : [];

  const pieLiber = data ? [
    { name: "Pendentes",  value: data.liberacoes.pendentes,  fill: C.turq },
    { name: "Processadas",value: data.liberacoes.processadas, fill: C.green },
  ] : [];

  // ── Rota label ──────────────────────────────────────────────────────────
  const rotaData = (data?.transferencias.porRota ?? []).map((r) => ({
    rota:        `${r.origem}→${r.destino}`,
    Pendentes:   r.pendentes,
    Processadas: r.processadas,
    total:       r.total,
  }));

  const supData = (data?.porSupridor ?? []).map((s) => ({
    supridor: s.supridor.length > 14 ? s.supridor.slice(0, 13) + "…" : s.supridor,
    supridorFull: s.supridor,
    horas: parseFloat((s.tempoMedioHoras ?? 0).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.petrol }}>
            Dashboard Operacional
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>
            Métricas de {MESES[parseInt(mes) - 1]} / {ano}
            {!isPlanejamento && " — visão dos seus registros"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro mês */}
          <Select value={mes} onValueChange={(v) => { setMes(v); }}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro ano */}
          <Select value={ano} onValueChange={(v) => { setAno(v); }}>
            <SelectTrigger className="w-24 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}
                  className="h-9 w-9 p-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={36} className="animate-spin" style={{ color: C.petrol }} />
        </div>
      ) : (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              icon={<ArrowLeftRight size={20} />}
              label="Transferências"
              value={String(data?.transferencias.total ?? 0)}
              sub="itens no período"
              accentColor={C.petrol}
              pendentes={data?.transferencias.pendentes}
              processadas={data?.transferencias.processadas}
              total={data?.transferencias.total}
            />
            <KpiCard
              icon={<FileText size={20} />}
              label="Liberações"
              value={String(data?.liberacoes.total ?? 0)}
              sub="solicitações no período"
              accentColor={C.green}
              pendentes={data?.liberacoes.pendentes}
              processadas={data?.liberacoes.processadas}
              total={data?.liberacoes.total}
            />
            <KpiCard
              icon={<Clock size={20} />}
              label="Tempo Médio — Transf."
              value={data?.transferencias.tempoMedioHoras != null
                ? formatBusinessHours(data.transferencias.tempoMedioHoras)
                : "—"}
              sub="em horas úteis (08h–17h)"
              accentColor={C.turq}
            />
            <KpiCard
              icon={<Clock size={20} />}
              label="Tempo Médio — Liber."
              value={data?.liberacoes.tempoMedioHoras != null
                ? formatBusinessHours(data.liberacoes.tempoMedioHoras)
                : "—"}
              sub="em horas úteis (08h–17h)"
              accentColor="#F59E0B"
            />
          </div>

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Distribuição de status — donut duplo */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: C.petrol }} />
                <h2 className="text-sm font-semibold" style={{ color: C.petrol }}>Distribuição por Status</h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Transferências */}
                <div className="text-center">
                  <p className="text-[11px] font-medium mb-1" style={{ color: C.muted }}>Transferências</p>
                  {data && data.transferencias.total > 0 ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={pieTransf} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                             dataKey="value" stroke="none">
                          {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
                          {pieTransf.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Tooltip formatter={(v: any) => [`${v} itens`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-35 flex items-center justify-center text-xs" style={{ color: C.muted }}>Sem dados</div>
                  )}
                  <div className="flex justify-center gap-3 mt-1" style={{ fontSize: 10, color: C.muted }}>
                    {pieTransf.map((e) => (
                      <span key={e.name} className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: e.fill }} />
                        {e.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Liberações */}
                <div className="text-center">
                  <p className="text-[11px] font-medium mb-1" style={{ color: C.muted }}>Liberações</p>
                  {data && data.liberacoes.total > 0 ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={pieLiber} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                             dataKey="value" stroke="none">
                          {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
                          {pieLiber.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Tooltip formatter={(v: any) => [`${v} sol.`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-35 flex items-center justify-center text-xs" style={{ color: C.muted }}>Sem dados</div>
                  )}
                  <div className="flex justify-center gap-3 mt-1" style={{ fontSize: 10, color: C.muted }}>
                    {pieLiber.map((e) => (
                      <span key={e.name} className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: e.fill }} />
                        {e.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Transferências por Rota */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} style={{ color: C.petrol }} />
                <h2 className="text-sm font-semibold" style={{ color: C.petrol }}>Transferências por Rota</h2>
                <span className="ml-auto text-[11px]" style={{ color: C.muted }}>Top 12</span>
              </div>
              {rotaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={rotaData} layout="vertical"
                            margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="rota" tick={{ fontSize: 10, fill: C.text }}
                           width={90} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Pendentes"   fill={C.turq}   radius={[0, 3, 3, 0]} stackId="a" />
                    <Bar dataKey="Processadas" fill={C.petrol} radius={[0, 3, 3, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: C.muted }}>
                  Nenhuma transferência no período
                </div>
              )}
              <div className="flex gap-4 mt-3 text-[11px]" style={{ color: C.muted }}>
                <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: C.turq }} />Pendentes</span>
                <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: C.petrol }} />Processadas</span>
              </div>
            </div>
          </div>

          {/* ── Charts Row 2 — Tempo por Supridor ── */}
          {supData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} style={{ color: C.green }} />
                <h2 className="text-sm font-semibold" style={{ color: C.petrol }}>
                  Tempo Médio de Resposta por Supridor
                </h2>
                <span className="ml-auto text-[11px]" style={{ color: C.muted }}>em horas úteis</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={supData} margin={{ top: 0, right: 16, bottom: 32, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="supridor" tick={{ fontSize: 10, fill: C.text }}
                         axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false}
                         tickFormatter={(v) => `${v}h`} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(v: any, _: any, p: any) => [`${v}h — ${p?.payload?.supridorFull ?? ""}`, "Tempo médio"]} />
                  <Bar dataKey="horas" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {supData.map((_, i) => (
                      // eslint-disable-next-line @typescript-eslint/no-deprecated
                      <Cell key={i} fill={i % 2 === 0 ? C.green : C.turq} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Empty state geral ── */}
          {data && data.transferencias.total === 0 && data.liberacoes.total === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <BarChart2 size={40} className="mx-auto mb-3" style={{ color: C.muted }} />
              <p className="text-sm font-medium" style={{ color: C.petrol }}>Nenhum dado para {MESES[parseInt(mes) - 1]} / {ano}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>Selecione outro período ou aguarde novas solicitações.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
