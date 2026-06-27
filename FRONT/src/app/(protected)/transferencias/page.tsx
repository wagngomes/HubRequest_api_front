export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-server";
import { TransferenciasClient } from "@/components/transferencias/transferencias-client";

export const metadata: Metadata = {
  title: "Transferências | Hub Request Plan",
};

export default async function TransferenciasPage() {
  const session = await getServerSession();
  const isPlanejamento = session?.setor === "PLANEJAMENTO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#16455C" }}>
          Transferências entre CDs
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isPlanejamento
            ? "Gerencie todas as solicitações de transferência"
            : "Suas solicitações de transferência"}
        </p>
      </div>
      <TransferenciasClient isPlanejamento={isPlanejamento ?? false} />
    </div>
  );
}
