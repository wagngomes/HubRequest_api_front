"use client";

import { Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MonitoringSection({ isAdmin: _isAdmin }: { isAdmin: boolean }) {
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity size={18} style={{ color: "#16455C" }} />
        <h2 className="text-base font-semibold" style={{ color: "#16455C" }}>Monitoramento do Sistema</h2>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF5F9" }}>
          <Activity size={28} style={{ color: "#16455C" }} />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Observabilidade via Grafana</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Logs, métricas e rastreamento de erros estão disponíveis no Grafana Cloud.
            Acesse o dashboard para visualizar o estado da aplicação em tempo real.
          </p>
        </div>
        {grafanaUrl ? (
          <Button
            asChild
            style={{ backgroundColor: "#16455C", color: "white" }}
            className="gap-2"
          >
            <a href={grafanaUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> Abrir Grafana
            </a>
          </Button>
        ) : (
          <p className="text-xs text-gray-400">
            Configure <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GRAFANA_URL</code> no .env.local para exibir o link.
          </p>
        )}
      </div>
    </div>
  );
}
