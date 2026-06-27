import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar user={session} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader user={session} />
          <main
            className="flex-1 overflow-y-auto p-6"
            style={{ backgroundColor: "#F5F5F5" }}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
