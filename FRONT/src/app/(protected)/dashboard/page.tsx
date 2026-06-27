export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = { title: "Dashboard | Hub Request Plan" };

export default async function DashboardPage() {
  const session = await getServerSession();
  const isPlanning = session ? isPlanejamento(session) : false;
  return <DashboardClient isPlanejamento={isPlanning} />;
}
