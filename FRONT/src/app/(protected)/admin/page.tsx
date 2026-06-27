export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { AdminClient } from "@/components/admin/admin-client";

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/home");

  return <AdminClient isAdmin={session.role === "ADMIN"} />;
}
