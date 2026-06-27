"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props   { children: React.ReactNode; fallback?: React.ReactNode }
interface State   { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: React.ErrorInfo) {
    // Erros são capturados pelo Grafana/Loki via API
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
        <AlertTriangle size={40} style={{ color: "#EF4444" }} />
        <div>
          <p className="font-semibold text-gray-800">Algo deu errado</p>
          <p className="text-sm text-gray-500 mt-1">O erro foi registrado automaticamente.</p>
          {this.state.error && (
            <p className="text-xs text-red-500 mt-2 font-mono">{this.state.error.message}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false, error: null })}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
