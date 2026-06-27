"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { adminConstantesSchema } from "@/lib/validations/admin";
import type { AdminConstantesInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";

export function ConstantesSection() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const form = useForm<AdminConstantesInput>({
    resolver: zodResolver(adminConstantesSchema),
    defaultValues: { minimoTransferencia: 0, minimoPitagoras: 0 },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: { minimoTransferencia: number; minimoPitagoras: number } }>("/admin/constantes");
      if (json.data) {
        form.reset({
          minimoTransferencia: json.data.minimoTransferencia ?? 0,
          minimoPitagoras:     json.data.minimoPitagoras     ?? 0,
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar constantes" });
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { load(); }, [load]);

  async function onSubmit(data: AdminConstantesInput) {
    setSaving(true);
    try {
      await apiFetch("/admin/constantes", { method: "PATCH", body: JSON.stringify(data) });
      toast({ title: "Constantes atualizadas com sucesso!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin" style={{ color: "#16455C" }} />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EBF5F9" }}>
          <Settings2 size={16} style={{ color: "#16455C" }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "#16455C" }}>Valores mínimos</h2>
          <p className="text-xs text-gray-500">Defina os valores mínimos usados nas regras de negócio</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Mínimo Transferência */}
        <div className="p-4 rounded-lg border border-gray-200 space-y-3" style={{ backgroundColor: "#EBF5F9" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>
              Mínimo para Transferência
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Valor mínimo de CMV para que uma transferência seja permitida
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Valor (R$) *</Label>
            <div className="flex items-center gap-2 max-w-48">
              <span className="text-sm text-gray-500 shrink-0">R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="bg-white"
                {...form.register("minimoTransferencia")}
              />
            </div>
            {form.formState.errors.minimoTransferencia && (
              <p className="text-xs text-red-500">{form.formState.errors.minimoTransferencia.message}</p>
            )}
          </div>
        </div>

        {/* Mínimo Pitágoras */}
        <div className="p-4 rounded-lg border border-gray-200 space-y-3" style={{ backgroundColor: "#F0FBF8" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#2E9B7C" }}>
              Mínimo para Liberação Pitágoras
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Valor mínimo de pedido para que uma liberação no Pitágoras seja solicitada
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Valor (R$) *</Label>
            <div className="flex items-center gap-2 max-w-48">
              <span className="text-sm text-gray-500 shrink-0">R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="bg-white"
                {...form.register("minimoPitagoras")}
              />
            </div>
            {form.formState.errors.minimoPitagoras && (
              <p className="text-xs text-red-500">{form.formState.errors.minimoPitagoras.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button type="submit" disabled={saving} style={{ backgroundColor: "#16455C", color: "white" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar constantes
          </Button>
        </div>
      </form>
    </div>
  );
}
