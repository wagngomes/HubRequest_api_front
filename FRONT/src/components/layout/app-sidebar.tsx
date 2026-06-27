"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  FileText,
  Home,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-provider";
import type { SessionUser } from "@/types";

const NAV_ITEMS = [
  { href: "/home", label: "Início", icon: Home, adminOnly: false },
  { href: "/transferencias", label: "Transferências", icon: ArrowLeftRight, adminOnly: false },
  { href: "/liberacoes", label: "Liberações", icon: FileText, adminOnly: false },
  { href: "/admin", label: "Administração", icon: ShieldCheck, adminOnly: true },
];

interface AppSidebarProps {
  user: SessionUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { isOpen, isCollapsed, toggleCollapsed, close } = useSidebar();

  const initials = user.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo + botão collapse (desktop) ── */}
      <div
        className="flex items-center border-b shrink-0"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          minHeight: "56px",
          padding: isCollapsed ? "0 12px" : "0 16px",
          justifyContent: isCollapsed ? "center" : "space-between",
        }}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#7FD9CD" }}
          >
            <ClipboardList size={18} color="#16455C" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">
                Hub Request
              </p>
              <p className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                Plan
              </p>
            </div>
          )}
        </div>

        {/* Botão fechar no mobile */}
        <button
          onClick={close}
          className="md:hidden text-white/60 hover:text-white transition-colors p-1 rounded"
        >
          <X size={18} />
        </button>

        {/* Botão collapse no desktop */}
        {!isCollapsed && (
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Recolher menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── Navegação ── */}
      <nav
        className={cn(
          "flex-1 py-4 space-y-1 overflow-y-auto",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
        {NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN").map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                isCollapsed
                  ? "justify-center w-10 h-10 mx-auto"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
              style={isActive ? { backgroundColor: "#7FD9CD", color: "#16455C" } : {}}
            >
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Botão expand (quando colapsado, desktop) ── */}
      {isCollapsed && (
        <div className="hidden md:flex justify-center py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center w-8 h-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Expandir menu"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Usuário ── */}
      <div
        className={cn(
          "border-t shrink-0",
          isCollapsed ? "px-2 py-3" : "px-4 py-4"
        )}
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          title={isCollapsed ? `${user.nome} — ${user.setor}` : undefined}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: "#2E9B7C", color: "white" }}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.nome}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                {user.setor}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
        style={{
          backgroundColor: "#16455C",
          borderRight: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── MOBILE overlay backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 md:hidden flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: "#16455C",
          borderRight: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
