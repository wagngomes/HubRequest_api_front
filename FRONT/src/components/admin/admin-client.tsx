"use client";

import { useState } from "react";
import { Users, Package, MapPin, Bell, Clock, Settings2, Building2, ShieldX, Activity } from "lucide-react";
import { UsersSection } from "./users-section";
import { ProductsSection } from "./products-section";
import { CentrosSection } from "./centros-section";
import { NotificacoesSection } from "./notificacoes-section";
import { SlasSection } from "./slas-section";
import { ConstantesSection } from "./constantes-section";
import { MarcasSection } from "./marcas-section";
import { RestricoesSection } from "./restricoes-section";
import { MonitoringSection } from "./monitoring-section";

type Tab = "usuarios" | "produtos" | "centros" | "slas" | "constantes" | "notificacoes" | "supridores" | "restricoes" | "monitoramento";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "usuarios",      label: "Usuários",                icon: Users     },
  { id: "produtos",      label: "Produtos",                icon: Package   },
  { id: "supridores",    label: "Supridores",              icon: Building2 },
  { id: "centros",       label: "Centros de Distribuição", icon: MapPin    },
  { id: "slas",          label: "SLA entre CDs",           icon: Clock     },
  { id: "restricoes",    label: "Restrições Transf.",      icon: ShieldX   },
  { id: "constantes",    label: "Constantes",              icon: Settings2 },
  { id: "notificacoes",  label: "Notificações",            icon: Bell      },
  { id: "monitoramento", label: "Monitoramento",           icon: Activity  },
];

export function AdminClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("usuarios");

  return (
    <div className="flex flex-col h-full">
      {/* ── Cabeçalho ── */}
      <div
        className="px-6 py-5 border-b border-gray-200 shrink-0"
        style={{ backgroundColor: "#EBF5F9" }}
      >
        <h1 className="text-xl font-bold" style={{ color: "#16455C" }}>
          Administração
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerencie usuários, produtos, supridores e configurações do sistema
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 border-b border-gray-200 bg-white shrink-0 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap"
                style={{
                  borderBottomColor: isActive ? "#16455C" : "transparent",
                  color: isActive ? "#16455C" : "#6B7280",
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "usuarios"    && <UsersSection />}
        {activeTab === "produtos"    && <ProductsSection />}
        {activeTab === "supridores"  && <MarcasSection />}
        {activeTab === "centros"     && <CentrosSection />}
        {activeTab === "slas"        && <SlasSection />}
        {activeTab === "restricoes"  && <RestricoesSection />}
        {activeTab === "constantes"  && <ConstantesSection />}
        {activeTab === "notificacoes"  && <NotificacoesSection />}
        {activeTab === "monitoramento" && <MonitoringSection isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
