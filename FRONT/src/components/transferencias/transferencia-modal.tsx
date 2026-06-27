"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, CheckCircle2, AlertCircle, Plus, Trash2,
  Package, PartyPopper, Check, ShieldX, DollarSign,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { useCentros } from "@/hooks/use-centros";
import { useSlas } from "@/hooks/use-slas";
import { transferenciaItemSchema, transferenciaItemStatusSchema } from "@/lib/validations/transferencia";
import type { TransferenciaItemInput, TransferenciaItemStatusInput } from "@/lib/validations/transferencia";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { SolicitacaoTransferenciaWithDetails, TransferenciaItem, TransferenciaItemWithSolicitacao } from "@/types";

/* ── Props ────────────────────────────────────────────────────────────── */
interface TransferenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "create" | "status";
  id: string | null;
  onSuccess: () => void;
}

const ITEM_DEFAULTS: TransferenciaItemInput = {
  codigo: "", descricao: "", controlado: "N", refrigerado: "N",
  origem: "", destino: "", quantidade: 1,
};

/* ── Helper: seção com cabeçalho colorido ────────────────────────────── */
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>{title}</span>
    </div>
    <div className="p-4 space-y-3 bg-white">
      {children}
    </div>
  </div>
);

/* ── Tipos auxiliares ─────────────────────────────────────────────────── */
type RestricaoEntry = { tributacao: string; origem: string; destino: string };
type ItemComCmv = TransferenciaItemInput & { cmv: number };

/* ── Componente principal ────────────────────────────────────────────── */
export function TransferenciaModal({ open, onOpenChange, mode, id, onSuccess }: TransferenciaModalProps) {
  const { centros } = useCentros();
  const { isLiberado } = useSlas();
  const [isLoading, setIsLoading]     = useState(false);
  const [isFetching, setIsFetching]   = useState(false);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoTransferenciaWithDetails | null>(null);
  const [selectedItem, setSelectedItem] = useState<TransferenciaItemWithSolicitacao | null>(null);

  // CREATE state
  const [itens, setItens]         = useState<ItemComCmv[]>([]);
  const [obs, setObs]             = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Product lookup state
  const [produtoStatus, setProdutoStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [produtoMultiplo, setProdutoMultiplo]     = useState<number>(1);
  const [produtoTributacao, setProdutoTributacao] = useState<string>("-");
  const [produtoCmv, setProdutoCmv]               = useState<number>(0);

  // Verificações
  const [rotaBloqueada, setRotaBloqueada]         = useState(false);
  const [restricaoBloqueada, setRestricaoBloqueada] = useState(false);
  const [restricoes, setRestricoes]               = useState<RestricaoEntry[]>([]);
  const [minimoTransferencia, setMinimoTransferencia] = useState<number>(0);

  const form = useForm<TransferenciaItemInput>({
    resolver: zodResolver(transferenciaItemSchema),
    defaultValues: ITEM_DEFAULTS,
  });

  const statusForm = useForm<TransferenciaItemStatusInput>({
    resolver: zodResolver(transferenciaItemStatusSchema),
    defaultValues: { status: "PENDENTE", notaFiscal: "", obs: "" },
  });

  // Carregar restrições e constantes ao montar o modal (CREATE mode)
  useEffect(() => {
    if (!open || mode !== "create") return;
    Promise.all([
      apiFetch<{ data: RestricaoEntry[] }>("/restricoes"),
      apiFetch<{ data: { minimoTransferencia: number } }>("/constantes"),
    ]).then(([restricoesJson, constantesJson]) => {
      setRestricoes(restricoesJson.data ?? []);
      setMinimoTransferencia(constantesJson.data?.minimoTransferencia ?? 0);
    }).catch(() => {/* silencioso */});
  }, [open, mode]);

  // Reset ao fechar / buscar dados ao abrir
  useEffect(() => {
    if (!open) {
      setSolicitacao(null);
      setSelectedItem(null);
      setItens([]);
      setObs("");
      setCreatedId(null);
      setProdutoStatus("idle");
      setProdutoMultiplo(1);
      setProdutoTributacao("-");
      setProdutoCmv(0);
      setRotaBloqueada(false);
      setRestricaoBloqueada(false);
      form.reset(ITEM_DEFAULTS);
      statusForm.reset();
      return;
    }
    if (!id) return;

    setIsFetching(true);
    const path = mode === "status"
      ? `/transferencias/item/${id}`
      : `/transferencias/${id}`;

    apiFetch<{ data: SolicitacaoTransferenciaWithDetails | TransferenciaItemWithSolicitacao }>(path)
      .then(({ data }) => {
        if (mode === "view") {
          setSolicitacao(data as SolicitacaoTransferenciaWithDetails);
        } else if (mode === "status") {
          const item = data as TransferenciaItemWithSolicitacao;
          setSelectedItem(item);
          statusForm.reset({ status: item.status, notaFiscal: "", obs: "" });
        }
      })
      .catch(() => toast({ variant: "destructive", title: "Erro ao carregar" }))
      .finally(() => setIsFetching(false));
  }, [open, id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar restrição sempre que tributacao, origem ou destino mudam
  const checkRestricao = useCallback((tributacao: string, origem: string, destino: string) => {
    if (!tributacao || !origem || !destino || tributacao === "-") {
      setRestricaoBloqueada(false);
      return;
    }
    const bloqueada = restricoes.some(
      (r) => r.tributacao === tributacao && r.origem === origem && r.destino === destino
    );
    setRestricaoBloqueada(bloqueada);
  }, [restricoes]);

  // Lookup de produto ao sair do campo código
  const handleCodigoBlur = useCallback(async () => {
    const codigo = form.getValues("codigo").trim().toUpperCase();
    if (!codigo) return;
    setProdutoStatus("loading");
    try {
      const { data } = await apiFetch<{ data: { codigo: string; descricao: string; refrigerado: "S"|"N"; controlado: "S"|"N"; multiplo: number; tributacao: string; cmv: number } }>(
        `/produtos/${encodeURIComponent(codigo)}`
      ).catch(() => { setProdutoStatus("not_found"); return null; }) ?? { data: null };
      if (!data) {
        form.setValue("descricao", "");
        setProdutoCmv(0);
        return;
      }
      setProdutoStatus("found");
      form.setValue("codigo",      data.codigo,      { shouldValidate: true });
      form.setValue("descricao",   data.descricao,   { shouldValidate: true });
      form.setValue("refrigerado", data.refrigerado, { shouldValidate: true });
      form.setValue("controlado",  data.controlado,  { shouldValidate: true });
      setProdutoMultiplo(data.multiplo ?? 1);
      setProdutoTributacao(data.tributacao ?? "-");
      setProdutoCmv(data.cmv ?? 0);

      // Re-verificar restrição com nova tributação
      const origem  = form.getValues("origem");
      const destino = form.getValues("destino");
      checkRestricao(data.tributacao ?? "-", origem, destino);
    } catch {
      setProdutoStatus("not_found");
    }
  }, [form, checkRestricao]);

  // Calcular valor total dos itens
  const valorTotal = itens.reduce((sum, item) => sum + item.quantidade * item.cmv, 0);

  function handleAddItem(data: TransferenciaItemInput) {
    if (itens.length >= 20) {
      toast({ variant: "destructive", title: "Limite de 20 itens atingido" });
      return;
    }
    if (produtoMultiplo > 1 && data.quantidade % produtoMultiplo !== 0) {
      toast({
        variant: "destructive",
        title: "Quantidade inválida",
        description: `A quantidade deve ser múltiplo de ${produtoMultiplo}. Ex: ${produtoMultiplo}, ${produtoMultiplo * 2}, ${produtoMultiplo * 3}...`,
      });
      return;
    }
    if (restricaoBloqueada) {
      toast({ variant: "destructive", title: "Transferência restrita", description: "A tributação do produto não permite transferência entre a origem e destino selecionados." });
      return;
    }
    setItens((prev) => [...prev, { ...data, cmv: produtoCmv }]);
    form.reset(ITEM_DEFAULTS);
    setProdutoStatus("idle");
    setProdutoMultiplo(1);
    setProdutoTributacao("-");
    setProdutoCmv(0);
    setRestricaoBloqueada(false);
    setRotaBloqueada(false);
  }

  function handleRemoveItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFinalizar() {
    if (itens.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos um item" });
      return;
    }
    if (minimoTransferencia > 0 && valorTotal < minimoTransferencia) {
      toast({
        variant: "destructive",
        title: "Valor mínimo não atingido",
        description: `O valor total da transferência (${formatCurrency(valorTotal)}) deve ser pelo menos ${formatCurrency(minimoTransferencia)}.`,
      });
      return;
    }
    setIsLoading(true);
    try {
      const json = await apiFetch<{ data: { id: string } }>("/transferencias", {
        method: "POST",
        body: JSON.stringify({ obs: obs || undefined, itens: itens.map(({ cmv: _, ...rest }) => rest) }),
      });
      setCreatedId(json.data.id);
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onStatusSubmit(data: TransferenciaItemStatusInput) {
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = { status: data.status };
      if (data.status === "PROCESSADA" && data.notaFiscal?.trim()) {
        payload.notaFiscal = data.notaFiscal.trim();
      }
      if (data.obs?.trim()) payload.obs = data.obs.trim();
      await apiFetch(`/transferencias/item/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast({ title: "Status do item atualizado com sucesso!" });
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center h-40">
            <Loader2 size={32} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">

        {/* ── Cabeçalho do modal ── */}
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C", color: "white" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {mode === "view"    ? "Detalhes da Transferência"
                : mode === "status" ? "Atualizar Status"
                : createdId         ? "Solicitação registrada!"
                : "Nova Solicitação de Transferência"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* ════ VIEW ════════════════════════════════════════════════════ */}
        {mode === "view" && solicitacao && (
          <>
            <ViewTransferencia solicitacao={solicitacao} />
            <div className="flex justify-end pt-3 border-t border-gray-100 mt-4">
              <Button
                type="button"
                style={{ backgroundColor: "#16455C", color: "white" }}
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </div>
          </>
        )}

        {/* ════ STATUS ══════════════════════════════════════════════════ */}
        {mode === "status" && selectedItem && (
          <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg border border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold" style={{ color: "#16455C" }}>
                  Solicitação: {selectedItem.solicitacaoId}
                </span>
                <span className="text-gray-300">·</span>
                <StatusBadge status={selectedItem.status} />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                <span className="font-mono" style={{ color: "#16455C" }}>{selectedItem.codigo}</span>
                <span className="text-gray-300 mx-1.5">—</span>
                {selectedItem.descricao}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedItem.origem} → {selectedItem.destino} · {selectedItem.quantidade} un
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Novo status do item</Label>
              <Controller control={statusForm.control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => {
                  field.onChange(v);
                  if (v !== "PROCESSADA") statusForm.setValue("notaFiscal", "");
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                    <SelectItem value="PROCESSADA">✅ Processada</SelectItem>
                    <SelectItem value="NAO_PROCESSADA">🚫 Não Processada</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            {statusForm.watch("status") === "PROCESSADA" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                  Nota Fiscal *
                  <span className="text-[10px] font-normal text-amber-600 normal-case">obrigatório para processar</span>
                </Label>
                <Input
                  placeholder="Informe o número da Nota Fiscal"
                  className="font-mono uppercase"
                  {...statusForm.register("notaFiscal")}
                />
                {statusForm.formState.errors.notaFiscal && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {statusForm.formState.errors.notaFiscal.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Observação <span className="font-normal normal-case text-gray-400">(opcional)</span>
              </Label>
              <textarea
                rows={3}
                placeholder="Informe uma observação para o solicitante..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16455C] focus:border-transparent resize-none"
                {...statusForm.register("obs")}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (statusForm.watch("status") === "PROCESSADA" && !statusForm.watch("notaFiscal")?.trim())
                }
                style={{ backgroundColor: "#16455C", color: "white" }}
              >
                {isLoading && <Loader2 size={14} className="animate-spin mr-1" />} Salvar
              </Button>
            </div>
          </form>
        )}

        {/* ════ CREATE › Sucesso ════════════════════════════════════════ */}
        {mode === "create" && createdId && (
          <div className="flex flex-col items-center py-10 gap-5 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E8F7F3" }}>
              <PartyPopper size={32} style={{ color: "#2E9B7C" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">Solicitação criada com sucesso!</p>
              <p className="text-sm text-gray-500 mt-1">Guarde este ID para acompanhar:</p>
            </div>
            <div
              className="px-8 py-4 rounded-xl border-2 font-mono text-3xl font-bold tracking-widest select-all"
              style={{ borderColor: "#16455C", color: "#16455C", backgroundColor: "#EBF5F9" }}
            >
              {createdId}
            </div>
            <p className="text-xs text-gray-400">{itens.length} item(ns) — o Planejamento será notificado por e-mail.</p>
            <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: "#16455C", color: "white" }}>
              <Check size={14} /> Concluir
            </Button>
          </div>
        )}

        {/* ════ CREATE › Formulário multi-item ═════════════════════════ */}
        {mode === "create" && !createdId && (
          <div className="space-y-5 pt-2">

            {/* Lista de itens adicionados */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "#16455C" }}>
                  <Package size={13} /> Itens da solicitação
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  itens.length >= 20
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-white text-gray-500 border-gray-200"
                }`}>
                  {itens.length}/20
                </span>
              </div>

              {itens.length === 0 ? (
                <div className="py-8 text-center bg-white">
                  <Package size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Preencha o formulário abaixo e clique em &quot;Adicionar item&quot;</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 bg-white">
                  {itens.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          <span className="font-mono" style={{ color: "#16455C" }}>{item.codigo}</span>
                          <span className="text-gray-300 mx-1.5">—</span>
                          {item.descricao}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.origem} → {item.destino} · {item.quantidade} un
                          {item.refrigerado === "S" && <span className="ml-1.5 text-blue-500">❄ Refrig.</span>}
                          {item.controlado  === "S" && <span className="ml-1.5 text-amber-500">⚠ Contr.</span>}
                        </p>
                        {item.cmv > 0 && (
                          <p className="text-xs font-medium mt-0.5" style={{ color: "#2E9B7C" }}>
                            CMV: {formatCurrency(item.cmv)} · Subtotal: {formatCurrency(item.quantidade * item.cmv)}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}

                  {/* Valor total */}
                  {valorTotal > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <DollarSign size={13} /> Valor total da transferência
                      </div>
                      <div className="flex items-center gap-2">
                        {minimoTransferencia > 0 && valorTotal < minimoTransferencia && (
                          <span className="text-[11px] text-red-500">
                            mínimo: {formatCurrency(minimoTransferencia)}
                          </span>
                        )}
                        <span
                          className="text-base font-bold"
                          style={{ color: minimoTransferencia > 0 && valorTotal < minimoTransferencia ? "#dc2626" : "#16455C" }}
                        >
                          {formatCurrency(valorTotal)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Formulário do item */}
            <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4">

              {/* Produto (grouped) */}
              <SectionCard title="Produto">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: PROD001"
                      className="pr-9 font-mono uppercase"
                      {...form.register("codigo", {
                        onChange: () => {
                          setProdutoStatus("idle");
                          setProdutoCmv(0);
                          setRestricaoBloqueada(false);
                        },
                      })}
                      onBlur={handleCodigoBlur}
                    />
                    {produtoStatus === "loading"   && <Loader2    size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                    {produtoStatus === "found"     && <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                    {produtoStatus === "not_found" && <AlertCircle  size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                  </div>
                  {produtoStatus === "not_found" && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Produto não encontrado.</p>}
                  {produtoStatus === "found"     && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Campos preenchidos automaticamente.</p>}
                  {form.formState.errors.codigo  && <p className="text-xs text-red-500">{form.formState.errors.codigo.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    Descrição *
                    {produtoStatus === "found" && <span className="text-[10px] font-normal text-emerald-600 normal-case">(preenchida automaticamente)</span>}
                  </Label>
                  <Input
                    placeholder="Preenchida automaticamente ao digitar o código"
                    readOnly={produtoStatus === "found"}
                    className={produtoStatus === "found" ? "bg-gray-50 text-gray-500 cursor-default border-dashed" : ""}
                    {...form.register("descricao")}
                  />
                  {form.formState.errors.descricao && <p className="text-xs text-red-500">{form.formState.errors.descricao.message}</p>}
                </div>

                {/* Refrigerado / Controlado */}
                <div className="grid grid-cols-2 gap-4">
                  {(["refrigerado", "controlado"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        {field === "refrigerado" ? "❄ Refrigerado" : "⚠ Controlado"}
                        {produtoStatus === "found" && <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>}
                      </Label>
                      <Controller control={form.control} name={field} render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange} disabled={produtoStatus === "found"}>
                          <SelectTrigger className={produtoStatus === "found" ? "bg-gray-50 border-dashed text-gray-500" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">Sim</SelectItem>
                            <SelectItem value="N">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  ))}
                </div>

                {/* Tributação, Múltiplo e Custo Médio (preenchidos automaticamente) */}
                {produtoStatus === "found" && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        Tributação
                        <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>
                      </Label>
                      <Input
                        value={produtoTributacao}
                        readOnly
                        className="bg-gray-50 text-gray-500 cursor-default border-dashed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        Múltiplo
                        <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>
                      </Label>
                      <Input
                        value={produtoMultiplo}
                        readOnly
                        className={`bg-gray-50 cursor-default border-dashed ${produtoMultiplo > 1 ? "text-amber-700 font-semibold" : "text-gray-500"}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        Custo Médio
                        <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>
                      </Label>
                      <Input
                        value={produtoCmv > 0 ? formatCurrency(produtoCmv) : "—"}
                        readOnly
                        className="bg-gray-50 text-gray-500 cursor-default border-dashed font-mono"
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Quantidade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  Quantidade *
                  {produtoMultiplo > 1 && (
                    <span className="text-[10px] font-normal text-amber-600 normal-case">
                      deve ser múltiplo de {produtoMultiplo}
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  min={produtoMultiplo > 1 ? produtoMultiplo : 1}
                  step={produtoMultiplo > 1 ? produtoMultiplo : 1}
                  className="max-w-40"
                  {...form.register("quantidade")}
                />
                {produtoMultiplo > 1 && (
                  <p className="text-[11px] text-amber-600">
                    Exemplos válidos: {produtoMultiplo}, {produtoMultiplo * 2}, {produtoMultiplo * 3}...
                  </p>
                )}
                {form.formState.errors.quantidade && <p className="text-xs text-red-500">{form.formState.errors.quantidade.message}</p>}
              </div>

              {/* Origem / Destino */}
              <div className="grid grid-cols-2 gap-4">
                {(["origem", "destino"] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {field === "origem" ? "CD Origem *" : "CD Destino *"}
                    </Label>
                    <Controller control={form.control} name={field} render={({ field: f }) => (
                      <Select value={f.value ?? ""} onValueChange={(v) => {
                        f.onChange(v);
                        const origem  = field === "origem"  ? v : form.getValues("origem");
                        const destino = field === "destino" ? v : form.getValues("destino");
                        if (origem && destino) {
                          setRotaBloqueada(!isLiberado(origem, destino));
                        } else {
                          setRotaBloqueada(false);
                        }
                        checkRestricao(produtoTributacao, origem, destino);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder={field === "origem" ? "Selecione a origem" : "Selecione o destino"} />
                        </SelectTrigger>
                        <SelectContent>
                          {centros.map((cd) => (
                            <SelectItem key={cd.codigo} value={cd.codigo}>{cd.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )} />
                    {form.formState.errors[field] && <p className="text-xs text-red-500">{form.formState.errors[field]?.message}</p>}
                  </div>
                ))}
              </div>

              {/* Aviso de rota bloqueada */}
              {rotaBloqueada && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Rota não permitida</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      A transferência entre o CD de Origem e o CD de Destino selecionados está bloqueada.
                      Verifique com o time de Planejamento.
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso de restrição de tributação */}
              {restricaoBloqueada && !rotaBloqueada && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50">
                  <ShieldX size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700">Transferência restrita por tributação</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      A tributação <strong>{produtoTributacao}</strong> não permite transferência entre a origem e destino selecionados.
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full border-dashed border-gray-300 text-gray-600 hover:border-[#16455C] hover:text-[#16455C]"
                disabled={
                  produtoStatus === "loading" ||
                  produtoStatus === "not_found" ||
                  itens.length >= 20 ||
                  rotaBloqueada ||
                  restricaoBloqueada
                }
              >
                <Plus size={15} /> Adicionar item à solicitação
              </Button>
            </form>

            {/* Observação geral */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observação geral (opcional)</Label>
              <Textarea
                placeholder="Informações adicionais para toda a solicitação..."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                {itens.length === 0
                  ? "Adicione ao menos 1 item para finalizar"
                  : (
                    <span>
                      {itens.length} item(ns){" "}
                      {valorTotal > 0 && (
                        <span
                          className="font-semibold"
                          style={{ color: minimoTransferencia > 0 && valorTotal < minimoTransferencia ? "#dc2626" : "#16455C" }}
                        >
                          · Total: {formatCurrency(valorTotal)}
                        </span>
                      )}
                    </span>
                  )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button
                  onClick={handleFinalizar}
                  disabled={isLoading || itens.length === 0}
                  style={{ backgroundColor: "#16455C", color: "white" }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Finalizar ({itens.length} item{itens.length !== 1 ? "s" : ""})
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Visão detalhada ─────────────────────────────────────────────────── */
function ViewTransferencia({ solicitacao }: { solicitacao: SolicitacaoTransferenciaWithDetails }) {
  return (
    <div className="space-y-4 pt-2">
      {/* Header info */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">ID</p>
          <p className="font-mono font-bold text-xl mt-0.5" style={{ color: "#16455C" }}>{solicitacao.id}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
          <div className="mt-1"><StatusBadge status={solicitacao.status} /></div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Data</p>
          <p className="text-sm text-gray-700 mt-0.5">{formatDate(solicitacao.createdAt)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Solicitante</p>
          <p className="text-sm text-gray-700 mt-0.5">
            {solicitacao.user.nome} <span className="text-gray-400">— {solicitacao.user.setor}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total de itens</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{solicitacao._count.itens}</p>
        </div>
        {solicitacao.obs && (
          <div className="col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Observação</p>
            <p className="text-sm text-gray-700 mt-0.5">{solicitacao.obs}</p>
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Itens da solicitação</p>
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {solicitacao.itens.map((item: TransferenciaItem, idx: number) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  <span className="font-mono" style={{ color: "#16455C" }}>{item.codigo}</span>
                  <span className="text-gray-300 mx-1.5">—</span>
                  {item.descricao}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.origem} → {item.destino}</p>
                {item.dataPrevisaoChegada && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#2E9B7C" }}>
                    Previsão: {item.dataPrevisaoChegada}
                  </p>
                )}
                {item.notaFiscal && (
                  <p className="text-xs text-gray-500 mt-0.5">NF: <span className="font-mono font-semibold">{item.notaFiscal}</span></p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-800">{item.quantidade} un</p>
                <div className="flex gap-1 justify-end mt-1 flex-wrap">
                  {item.refrigerado === "S" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-blue-500 border-blue-200">❄ Refrig.</Badge>}
                  {item.controlado  === "S" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-500 border-amber-200">⚠ Contr.</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
