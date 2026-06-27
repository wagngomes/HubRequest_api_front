"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Bell, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { SessionUser } from "@/types";

const SETOR_LABEL: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  COMERCIAL: "Comercial",
  OPERACOES: "Operações",
  OUTRO: "Outro",
};

interface AppHeaderProps {
  user: SessionUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter();
  const { toggleOpen, toggleCollapsed, isCollapsed } = useSidebar();

  const initials = user.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b bg-white"
      style={{ borderColor: "#e5e7eb", minHeight: "56px" }}
    >
      {/* Hamburger (mobile) + collapse toggle (desktop) + título */}
      <div className="flex items-center gap-2">
        {/* Mobile: abre o drawer */}
        <button
          onClick={toggleOpen}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title="Abrir menu"
        >
          <Menu size={18} />
        </button>

        {/* Desktop: colapsa/expande a sidebar */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <span className="text-sm font-medium" style={{ color: "#16455C" }}>
          Hub Request Plan
        </span>
      </div>

      {/* Ações do header */}
      <div className="flex items-center gap-3">
        {/* Notificações (visual) */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} style={{ color: "#6b7280" }} />
        </Button>

        {/* Menu do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-xs font-bold text-white"
                  style={{ backgroundColor: "#16455C" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none" style={{ color: "#16455C" }}>
                  {user.nome}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {SETOR_LABEL[user.setor] ?? user.setor}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user.nome}</p>
                <p className="text-xs font-normal text-gray-500">{user.email}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {SETOR_LABEL[user.setor] ?? user.setor}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" disabled>
              <User size={14} />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut size={14} />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
