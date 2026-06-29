import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { TravaDetalheClient } from "@/components/travas/trava-detalhe-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalhe da Trava | Hub Request Plan",
};

export default async function TravaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const [user, { id }] = await Promise.all([getServerSession(), params]);
  if (!user) redirect("/login");
  return <TravaDetalheClient id={id} userEmail={user.email} userRole={user.role} userSetor={user.setor} userName={user.nome} />;
}
