import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { TravasClient } from "@/components/travas/travas-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Travas | Regras | Hub Request Plan",
};

export default async function TravasPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  return <TravasClient userEmail={user.email} userRole={user.role} />;
}
