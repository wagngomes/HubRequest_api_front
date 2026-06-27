import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login | Hub Request Plan",
  description: "Acesse o portal de solicitações",
};

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/home");
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Painel esquerdo — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #16455C 0%, #1e6080 50%, #2E9B7C 100%)" }}>
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute top-40 left-40 w-96 h-96 rounded-full border border-white" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full border-2 border-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                 style={{ backgroundColor: "#7FD9CD" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#16455C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="#16455C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Hub Request Plan</span>
          </div>
          <p className="text-white/70 text-sm">Portal de Solicitações</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-white text-4xl font-bold leading-tight">
            Gerencie suas<br />
            <span style={{ color: "#7FD9CD" }}>solicitações para o planejamento</span><br />
            com eficiência
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            Portal centralizado para transferências entre centros de distribuição
            e liberações de faturamento.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Transferências", icon: "🔄" },
            { label: "Liberações", icon: "✅" },
            { label: "Rastreamento", icon: "📊" },
          ].map((item) => (
            <div key={item.label}
                 className="rounded-xl p-4 text-center"
                 style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
           style={{ backgroundColor: "#F5F5F5" }}>
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ backgroundColor: "#16455C" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ color: "#16455C" }}>Hub Request Plan</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
