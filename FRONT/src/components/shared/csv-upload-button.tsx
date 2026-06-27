"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

interface CsvUploadButtonProps {
  endpoint: string;
  onSuccess?: (count?: number) => void;
}

export function CsvUploadButton({ endpoint, onSuccess }: CsvUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({ variant: "destructive", title: "Arquivo inválido", description: "Selecione um arquivo .csv" });
      return;
    }

    setStatus("loading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiFetch<{ count?: number }>(endpoint, {
        method: "POST",
        body: formData,
      });

      setStatus("success");
      toast({
        title: "Importação concluída!",
        description: `${data.count ?? ""} registro(s) importado(s) com sucesso.`,
      });
      onSuccess?.(data.count);

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      toast({
        variant: "destructive",
        title: "Falha na importação",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      // Reset input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const icons = {
    idle: <Upload size={16} />,
    loading: <Loader2 size={16} className="animate-spin" />,
    success: <CheckCircle2 size={16} />,
    error: <XCircle size={16} />,
  };

  const labels = {
    idle: "Importar CSV",
    loading: "Importando...",
    success: "Importado!",
    error: "Erro",
  };

  const colors = {
    idle: "#16455C",
    loading: "#16455C",
    success: "#2E9B7C",
    error: "#ef4444",
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={status === "loading"}
        style={{ backgroundColor: colors[status], color: "white" }}
        className="gap-2 min-w-36"
      >
        {icons[status]}
        {labels[status]}
      </Button>
    </>
  );
}
