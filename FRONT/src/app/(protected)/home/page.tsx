import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, FileText, ArrowRight, BarChart2, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Início | Hub Request Plan",
};

export default async function HomePage() {
  const user = await getServerSession();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Boas-vindas */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#16455C" }}>
          Olá, {user?.nome?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Bem-vindo ao portal de solicitações. O que deseja fazer hoje?
        </p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Card Transferências */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm flex flex-col">
          <div className="relative h-40 overflow-hidden"
               style={{ background: "linear-gradient(135deg, #16455C 0%, #1e6080 100%)" }}>
            {/* SVG ilustrativo */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" fill="none">
              <circle cx="350" cy="50" r="80" fill="white" />
              <circle cx="50" cy="180" r="60" fill="white" />
              <rect x="100" y="60" width="200" height="4" rx="2" fill="white" />
              <rect x="100" y="80" width="160" height="4" rx="2" fill="white" />
              <rect x="100" y="100" width="180" height="4" rx="2" fill="white" />
            </svg>
            {/* Ícone central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Warehouses */}
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22" stroke="white" fill="none" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight size={20} color="rgba(127,217,205,1)" />
                    <ArrowLeftRight size={16} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22" stroke="white" fill="none" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <Badge className="absolute top-3 right-3 text-xs"
                   style={{ backgroundColor: "#7FD9CD", color: "#16455C" }}>
              <ArrowLeftRight size={10} className="mr-1" />
              Transferências
            </Badge>
          </div>

          <CardHeader className="pb-2 flex-1">
            <CardTitle className="text-lg" style={{ color: "#16455C" }}>
              Transferências entre CDs
            </CardTitle>
            <CardDescription>
              Solicite transferências de produtos entre centros de distribuição. Acompanhe o status em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/transferencias">
              <Button className="w-full group-hover:shadow-md transition-shadow text-white"
                      style={{ backgroundColor: "#16455C", color: "white" }}>
                Acessar Transferências
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card Liberação Pitágoras */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm flex flex-col">
          <div className="relative h-40 overflow-hidden"
               style={{ background: "linear-gradient(135deg, #2E9B7C 0%, #3ab896 100%)" }}>
            {/* SVG ilustrativo */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" fill="none">
              <circle cx="350" cy="50" r="80" fill="white" />
              <circle cx="50" cy="180" r="60" fill="white" />
              <path d="M100 100 L300 100" stroke="white" strokeWidth="4" strokeDasharray="20 10" />
            </svg>
            {/* Ícone central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-6">
                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                  <FileText size={32} color="white" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
                    <path d="M9 12l2 2 4-4" stroke="rgba(127,217,205,1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <Badge className="absolute top-3 right-3 text-xs bg-white/20 text-white border-0">
              <FileText size={10} className="mr-1" />
              Pitágoras
            </Badge>
          </div>

          <CardHeader className="pb-2 flex-1">
            <CardTitle className="text-lg" style={{ color: "#16455C" }}>
              Liberação de Faturamento
            </CardTitle>
            <CardDescription>
              Solicite liberações Pitágoras. Gerencie aprovações e acompanhe o retorno do planejamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/liberacoes">
              <Button className="w-full group-hover:shadow-md transition-shadow text-white"
                      style={{ backgroundColor: "#2E9B7C", color: "white" }}>
                Acessar Liberações
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Dashboard */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm flex flex-col">
          <div className="relative h-40 overflow-hidden"
               style={{ background: "linear-gradient(135deg, #0f2f40 0%, #16455C 60%, #1a5570 100%)" }}>
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" fill="none">
              <rect x="30"  y="120" width="40" height="60" rx="4" fill="white" />
              <rect x="90"  y="80"  width="40" height="100" rx="4" fill="white" />
              <rect x="150" y="100" width="40" height="80"  rx="4" fill="white" />
              <rect x="210" y="60"  width="40" height="120" rx="4" fill="white" />
              <rect x="270" y="90"  width="40" height="90"  rx="4" fill="white" />
              <polyline points="50,110 110,70 170,90 230,50 290,80 350,40" stroke="rgba(127,217,205,0.6)" strokeWidth="3" fill="none" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <BarChart2 size={44} color="#7FD9CD" />
              </div>
            </div>
            <Badge className="absolute top-3 right-3 text-xs border-0"
                   style={{ backgroundColor: "#7FD9CD22", color: "#7FD9CD" }}>
              <BarChart2 size={10} className="mr-1" />
              Analytics
            </Badge>
          </div>

          <CardHeader className="pb-2 flex-1">
            <CardTitle className="text-lg" style={{ color: "#16455C" }}>
              Dashboard Operacional
            </CardTitle>
            <CardDescription>
              Acompanhe métricas de tempo de resposta, volume por rota e desempenho por supridor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full group-hover:shadow-md transition-shadow"
                      style={{ backgroundColor: "#16455C", color: "white" }}>
                Ver Dashboard
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Travas | Regras */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm flex flex-col">
          <div className="relative h-40 overflow-hidden"
               style={{ background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)" }}>
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" fill="none">
              <circle cx="350" cy="50" r="80" fill="white" />
              <circle cx="50" cy="180" r="60" fill="white" />
              <rect x="100" y="60" width="200" height="4" rx="2" fill="white" />
              <rect x="100" y="80" width="140" height="4" rx="2" fill="white" />
              <rect x="100" y="100" width="170" height="4" rx="2" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <Lock size={44} color="white" />
              </div>
            </div>
            <Badge className="absolute top-3 right-3 text-xs border-0"
                   style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
              <Lock size={10} className="mr-1" /> Travas
            </Badge>
          </div>

          <CardHeader className="pb-2 flex-1">
            <CardTitle className="text-lg" style={{ color: "#16455C" }}>
              Travas | Regras
            </CardTitle>
            <CardDescription>
              Consulte as travas e regras do planejamento por área. Envie mensagens e acompanhe o histórico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/travas">
              <Button className="w-full group-hover:shadow-md transition-shadow"
                      style={{ backgroundColor: "#7C3AED", color: "white" }}>
                Acessar Travas
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
