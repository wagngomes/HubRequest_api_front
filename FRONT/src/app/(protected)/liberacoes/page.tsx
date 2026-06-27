export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-server";
import { LiberacoesClient } from "@/components/liberacoes/liberacoes-client";

export const metadata: Metadata = {
  title: "Liberações | Hub Request Plan",
};

export default async function LiberacoesPage() {
  const session = await getServerSession();
  const isPlanejamento = session?.setor === "PLANEJAMENTO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#16455C" }}>
          Liberação de Faturamento — Pitágoras
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isPlanejamento
            ? "Gerencie todas as solicitações de liberação"
            : "Suas solicitações de liberação"}
        </p>
      </div>
      <LiberacoesClient isPlanejamento={isPlanejamento ?? false} />
    </div>
  );
}
