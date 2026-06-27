"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, CheckCircle2, AlertCircle, Plus, Trash2,
  Package, PartyPopper, ArrowLeft, Check, DollarSign,
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
import { StatusBadge, RetornoBadge } from "@/components/shared/status-badge";
import { useCentros } from "@/hooks/use-centros";
import { UFS_BRASIL } from "@/lib/constants/ufs-brasil";
import {
  liberacaoCabecalhoSchema,
  liberacaoItemSchema,
  liberacaoRetornoSchema,
  liberacaoItemStatusSchema,
} from "@/lib/validations/liberacao";
import type {
  LiberacaoCabecalhoInput,
  LiberacaoItemInput,
  LiberacaoRetornoInput,
  LiberacaoItemStatusInput,
} from "@/lib/validations/liberacao";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { SolicitacaoLiberacaoWithDetails, LiberacaoItem, LiberacaoItemWithSolicitacao } from "@/types";

/* ── Constantes ───────────────────────────────────────────────────────── */
const SISTEMA_LABEL: Record<string, string> = {
  MONEY: "Money",
  SALESFORCE: "Salesforce",
  MONEY_SALESFORCE: "Money + Salesforce",
};

const ITEM_DEFAULTS: LiberacaoItemInput = {
  codigo: "", descricao: "", contribuinte: "N",
  clienteUF: "", centro: "", cnpjCod: "",
  grupo2: "", quantidade: 1, valor: 0, linkPedidoCompl: "",
};

const CABECALHO_DEFAULTS: LiberacaoCabecalhoInput = {
  grupo: "", contrato: "", representante: "",
  moneyOuSalesforce: "MONEY", acao: "HABILITAR", obs: "",
};

type CreateStep = "cabecalho" | "itens";

interface LiberacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "create" | "retorno" | "status";
  id: string | null;
  onSuccess: () => void;
}

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

/* ── Helper: indicador de passo ──────────────────────────────────────── */
const StepIndicator = ({ current }: { current: CreateStep }) => (
  <div className="flex items-center gap-2 py-1">
    <div className={`flex items-center gap-1.5 text-xs font-medium ${current === "cabecalho" ? "text-[#16455C]" : "text-gray-400"}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        current === "cabecalho" ? "text-white" : "text-white bg-[#2E9B7C]"
      }`} style={current === "cabecalho" ? { backgroundColor: "#16455C" } : {}}>
        {current === "cabecalho" ? "1" : <Check size={10} />}
      </span>
      Informações gerais
    </div>
    <div className="flex-1 h-px bg-gray-200 mx-1" />
    <div className={`flex items-center gap-1.5 text-xs font-medium ${current === "itens" ? "text-[#16455C]" : "text-gray-300"}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        current === "itens" ? "text-white" : "bg-gray-200 text-gray-400"
      }`} style={current === "itens" ? { backgroundColor: "#16455C" } : {}}>
        2
      </span>
      Adicionar itens
    </div>
  </div>
);

/* ── Componente principal ─────────────────────────────────────────────── */
export function LiberacaoModal({
  open, onOpenChange, mode, id, onSuccess,
}: LiberacaoModalProps) {
  const { centros } = useCentros();
  const [isLoading, setIsLoading]   = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoLiberacaoWithDetails | null>(null);
  const [selectedItem, setSelectedItem] = useState<LiberacaoItemWithSolicitacao | null>(null);

  // CREATE flow
  const [createStep, setCreateStep] = useState<CreateStep>("cabecalho");
  const [cabecalho, setCabecalho]   = useState<LiberacaoCabecalhoInput | null>(null);
  const [itens, setItens]           = useState<LiberacaoItemInput[]>([]);
  const [createdId, setCreatedId]   = useState<string | null>(null);
  const [minimoPitagoras, setMinimoPitagoras] = useState<number>(0);

  // Product lookup
  const [produtoStatus, setProdutoStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");

  const cabecalhoForm = useForm<LiberacaoCabecalhoInput>({
    resolver: zodResolver(liberacaoCabecalhoSchema),
    defaultValues: CABECALHO_DEFAULTS,
  });

  const itemForm = useForm<LiberacaoItemInput>({
    resolver: zodResolver(liberacaoItemSchema),
    defaultValues: ITEM_DEFAULTS,
  });

  const retornoForm = useForm<LiberacaoRetornoInput>({
    resolver: zodResolver(liberacaoRetornoSchema),
    defaultValues: { retornoPlanejamento: "APROVADA", status: "PROCESSADA", obs: "" },
  });

  const itemStatusForm = useForm<LiberacaoItemStatusInput>({
    resolver: zodResolver(liberacaoItemStatusSchema),
    defaultValues: { status: "PENDENTE" },
  });

  // Carregar constante minimoPitagoras ao abrir em modo create
  useEffect(() => {
    if (!open || mode !== "create") return;
    apiFetch<{ data: { minimoPitagoras: number } }>("/constantes")
      .then((json) => setMinimoPitagoras(json.data?.minimoPitagoras ?? 0))
      .catch(() => {/* silencioso */});
  }, [open, mode]);

  // Reset ao fechar / buscar dados ao abrir
  useEffect(() => {
    if (!open) {
      setSolicitacao(null);
      setSelectedItem(null);
      setCreateStep("cabecalho");
      setCabecalho(null);
      setItens([]);
      setCreatedId(null);
      setProdutoStatus("idle");
      cabecalhoForm.reset(CABECALHO_DEFAULTS);
      itemForm.reset(ITEM_DEFAULTS);
      retornoForm.reset();
      itemStatusForm.reset();
      return;
    }
    if (!id) return;

    setIsFetching(true);

    // STATUS mode: busca o item individual
    // VIEW e RETORNO: busca a solicitação completa
    const path = mode === "status"
      ? `/liberacoes/item/${id}`
      : `/liberacoes/${id}`;

    apiFetch<{ data: SolicitacaoLiberacaoWithDetails | LiberacaoItemWithSolicitacao }>(path)
      .then(({ data }) => {
        if (mode === "status") {
          const item = data as LiberacaoItemWithSolicitacao;
          setSelectedItem(item);
          itemStatusForm.reset({ status: item.status === "PROCESSADA" ? "PROCESSADA" : "PENDENTE" });
        } else {
          const sol = data as SolicitacaoLiberacaoWithDetails;
          setSolicitacao(sol);
          if (mode === "retorno") {
            retornoForm.reset({
              retornoPlanejamento: sol.retornoPlanejamento ?? "APROVADA",
              status: sol.status,
              obs: sol.obs ?? "",
            });
          }
        }
      })
      .catch(() => toast({ variant: "destructive", title: "Erro ao carregar" }))
      .finally(() => setIsFetching(false));
  }, [open, id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lookup de produto ao sair do campo código
  const handleCodigoBlur = useCallback(async () => {
    const codigo = itemForm.getValues("codigo").trim().toUpperCase();
    if (!codigo) return;
    setProdutoStatus("loading");
    try {
      const { data } = await apiFetch<{ data: { codigo: string; descricao: string } }>(
        `/produtos/${encodeURIComponent(codigo)}`
      );
      setProdutoStatus("found");
      itemForm.setValue("codigo",    data.codigo,    { shouldValidate: true });
      itemForm.setValue("descricao", data.descricao, { shouldValidate: true });
    } catch {
      setProdutoStatus("not_found");
      itemForm.setValue("descricao", "");
    }
  }, [itemForm]);

  function handleCabecalhoContinue(data: LiberacaoCabecalhoInput) {
    setCabecalho(data);
    setCreateStep("itens");
  }

  function handleAddItem(data: LiberacaoItemInput) {
    if (itens.length >= 20) {
      toast({ variant: "destructive", title: "Limite de 20 itens atingido" });
      return;
    }
    setItens((prev) => [...prev, data]);
    itemForm.reset(ITEM_DEFAULTS);
    setProdutoStatus("idle");
  }

  function handleRemoveItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFinalizar() {
    if (itens.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos um item" });
      return;
    }
    const valorTotal = itens.reduce((sum, item) => sum + Number(item.valor ?? 0), 0);
    if (minimoPitagoras > 0 && valorTotal < minimoPitagoras) {
      toast({
        variant: "destructive",
        title: "Valor mínimo não atingido",
        description: `O valor total da solicitação (${formatCurrency(valorTotal)}) deve ser pelo menos ${formatCurrency(minimoPitagoras)}.`,
      });
      return;
    }
    setIsLoading(true);
    try {
      const json = await apiFetch<{ data: { id: string } }>("/liberacoes", {
        method: "POST",
        body: JSON.stringify({ ...cabecalho, itens }),
      });
      setCreatedId(json.data.id);
      onSuccess();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onItemStatusSubmit(data: LiberacaoItemStatusInput) {
    setIsLoading(true);
    try {
      await apiFetch(`/liberacoes/item/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      });
      toast({ title: "Status do item atualizado com sucesso!" });
      onSuccess();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRetornoSubmit(data: LiberacaoRetornoInput) {
    setIsLoading(true);
    try {
      await apiFetch(`/liberacoes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, status: "PROCESSADA" }),
      });
      toast({ title: "Retorno atualizado com sucesso!" });
      onSuccess();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
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
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#2E9B7C", color: "white" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {mode === "view"    ? "Detalhes da Liberação"
                : mode === "retorno" ? "Atualizar Retorno do Planejamento"
                : mode === "status"  ? "Atualizar Status do Item"
                : createdId          ? "Solicitação registrada!"
                : "Nova Liberação Pitágoras"}
            </DialogTitle>
          </div>

          {/* Indicador de passo (só no create, sem sucesso) */}
          {mode === "create" && !createdId && (
            <div className="pt-3">
              <StepIndicator current={createStep} />
            </div>
          )}

        </DialogHeader>

        {/* ════ VIEW ════════════════════════════════════════════════════ */}
        {mode === "view" && solicitacao && (
          <>
            <ViewLiberacao solicitacao={solicitacao} />
            <div className="flex justify-end pt-3 border-t border-gray-100 mt-4">
              <Button
                type="button"
                style={{ backgroundColor: "#2E9B7C", color: "white" }}
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </div>
          </>
        )}

        {/* ════ RETORNO ═════════════════════════════════════════════════ */}
        {mode === "retorno" && solicitacao && (
          <form onSubmit={retornoForm.handleSubmit(onRetornoSubmit)} className="space-y-4 pt-2">
            {/* Resumo */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold" style={{ color: "#16455C" }}>{solicitacao.id}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Contrato: {solicitacao.contrato} · {SISTEMA_LABEL[solicitacao.moneyOuSalesforce]} · {solicitacao._count.itens} item(ns)
                </p>
              </div>
              <RetornoBadge retorno={solicitacao.retornoPlanejamento} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Retorno do Planejamento *</Label>
              <Controller control={retornoForm.control} name="retornoPlanejamento" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APROVADA">✅ Aprovada</SelectItem>
                    <SelectItem value="REPROVADA">❌ Reprovada</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg border text-xs text-gray-500" style={{ backgroundColor: "#EBF5F9", borderColor: "#c8dde8" }}>
              <CheckCircle2 size={13} style={{ color: "#2E9B7C" }} />
              Status mudará automaticamente para <strong>Processada</strong> ao salvar o retorno.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observação (opcional)</Label>
              <Textarea placeholder="Justificativa ou observações..." className="resize-none" {...retornoForm.register("obs")} />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#2E9B7C", color: "white" }}>
                {isLoading && <Loader2 size={14} className="animate-spin mr-1" />} Salvar Retorno
              </Button>
            </div>
          </form>
        )}

        {/* ════ STATUS (item individual) ════════════════════════════════ */}
        {mode === "status" && selectedItem && (
          <form onSubmit={itemStatusForm.handleSubmit(onItemStatusSubmit)} className="space-y-4 pt-2">
            {/* Resumo do item */}
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
                CNPJ/Cód: {selectedItem.cnpjCod} · {selectedItem.centro} · {selectedItem.clienteUF}
                {" · "}{selectedItem.quantidade} un
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Novo status do item</Label>
              <Controller control={itemStatusForm.control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                    <SelectItem value="PROCESSADA">✅ Processada</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#2E9B7C", color: "white" }}>
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
              style={{ borderColor: "#2E9B7C", color: "#16455C", backgroundColor: "#EBF5F9" }}
            >
              {createdId}
            </div>
            <p className="text-xs text-gray-400">{itens.length} item(ns) — o Planejamento será notificado por e-mail.</p>
            <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: "#2E9B7C", color: "white" }}>
              <Check size={14} /> Concluir
            </Button>
          </div>
        )}

        {/* ════ CREATE › Passo 1: Cabeçalho ════════════════════════════ */}
        {mode === "create" && !createdId && createStep === "cabecalho" && (
          <form onSubmit={cabecalhoForm.handleSubmit(handleCabecalhoContinue)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grupo *</Label>
                <Input placeholder="Ex: GRP001" {...cabecalhoForm.register("grupo")} />
                {cabecalhoForm.formState.errors.grupo && (
                  <p className="text-xs text-red-500">{cabecalhoForm.formState.errors.grupo.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contrato *</Label>
                <Input placeholder="Número do contrato" {...cabecalhoForm.register("contrato")} />
                {cabecalhoForm.formState.errors.contrato && (
                  <p className="text-xs text-red-500">{cabecalhoForm.formState.errors.contrato.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Representante *</Label>
              <Input placeholder="Nome do representante" {...cabecalhoForm.register("representante")} />
              {cabecalhoForm.formState.errors.representante && (
                <p className="text-xs text-red-500">{cabecalhoForm.formState.errors.representante.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sistema *</Label>
                <Controller control={cabecalhoForm.control} name="moneyOuSalesforce" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONEY">Money</SelectItem>
                      <SelectItem value="SALESFORCE">Salesforce</SelectItem>
                      <SelectItem value="MONEY_SALESFORCE">Money + Salesforce</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {cabecalhoForm.formState.errors.moneyOuSalesforce && (
                  <p className="text-xs text-red-500">{cabecalhoForm.formState.errors.moneyOuSalesforce.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ação *</Label>
                <Controller control={cabecalhoForm.control} name="acao" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione a ação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HABILITAR">✅ Habilitar</SelectItem>
                      <SelectItem value="DESABILITAR">🚫 Desabilitar</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {cabecalhoForm.formState.errors.acao && (
                  <p className="text-xs text-red-500">{cabecalhoForm.formState.errors.acao.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observação geral (opcional)</Label>
              <Textarea
                placeholder="Informações adicionais para toda a solicitação..."
                className="resize-none"
                {...cabecalhoForm.register("obs")}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" style={{ backgroundColor: "#16455C", color: "white" }}>
                Continuar — Adicionar itens →
              </Button>
            </div>
          </form>
        )}

        {/* ════ CREATE › Passo 2: Itens ═════════════════════════════════ */}
        {mode === "create" && !createdId && createStep === "itens" && (
          <div className="space-y-5 pt-2">

            {/* Resumo do cabeçalho */}
            {cabecalho && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
                <div className="flex-1 text-xs text-gray-600 space-y-0.5">
                  <p><span className="font-semibold text-gray-500">Grupo:</span> {cabecalho.grupo}</p>
                  <p><span className="font-semibold text-gray-500">Contrato:</span> {cabecalho.contrato} · <span className="font-semibold text-gray-500">Sistema:</span> {SISTEMA_LABEL[cabecalho.moneyOuSalesforce]} · <span className="font-semibold text-gray-500">Ação:</span> {cabecalho.acao === "HABILITAR" ? "Habilitar" : "Desabilitar"}</p>
                  <p><span className="font-semibold text-gray-500">Representante:</span> {cabecalho.representante}</p>
                </div>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="text-xs h-7 gap-1 text-gray-500 hover:text-[#16455C] shrink-0"
                  onClick={() => setCreateStep("cabecalho")}
                >
                  <ArrowLeft size={12} /> Editar
                </Button>
              </div>
            )}

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
                          CNPJ/Cód: {item.cnpjCod} · {item.centro} · {item.clienteUF}
                          · {item.quantidade} un · {formatCurrency(item.valor)}
                        </p>
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
                  {(() => {
                    const valorTotal = itens.reduce((s, i) => s + Number(i.valor ?? 0), 0);
                    if (valorTotal <= 0) return null;
                    const abaixoMinimo = minimoPitagoras > 0 && valorTotal < minimoPitagoras;
                    return (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                          <DollarSign size={13} /> Valor total da solicitação
                        </div>
                        <div className="flex items-center gap-2">
                          {abaixoMinimo && (
                            <span className="text-[11px] text-red-500">
                              mínimo: {formatCurrency(minimoPitagoras)}
                            </span>
                          )}
                          <span className="text-base font-bold" style={{ color: abaixoMinimo ? "#dc2626" : "#2E9B7C" }}>
                            {formatCurrency(valorTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Formulário do item */}
            <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="space-y-4">

              {/* Produto */}
              <SectionCard title="Produto">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: PROD001"
                      className="pr-9 font-mono uppercase"
                      {...itemForm.register("codigo", {
                        onChange: () => setProdutoStatus("idle"),
                      })}
                      onBlur={handleCodigoBlur}
                    />
                    {produtoStatus === "loading"   && <Loader2    size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                    {produtoStatus === "found"     && <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                    {produtoStatus === "not_found" && <AlertCircle  size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                  </div>
                  {produtoStatus === "not_found" && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Produto não encontrado.</p>}
                  {produtoStatus === "found"     && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Descrição preenchida automaticamente.</p>}
                  {itemForm.formState.errors.codigo && <p className="text-xs text-red-500">{itemForm.formState.errors.codigo.message}</p>}
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
                    {...itemForm.register("descricao")}
                  />
                  {itemForm.formState.errors.descricao && <p className="text-xs text-red-500">{itemForm.formState.errors.descricao.message}</p>}
                </div>
              </SectionCard>

              {/* Quantidade / Valor / Contribuinte */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantidade *</Label>
                  <Input type="number" min={1} {...itemForm.register("quantidade")} />
                  {itemForm.formState.errors.quantidade && <p className="text-xs text-red-500">{itemForm.formState.errors.quantidade.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Valor *</Label>
                  <Input type="number" step="0.01" min={0} placeholder="0,00" {...itemForm.register("valor")} />
                  {itemForm.formState.errors.valor && <p className="text-xs text-red-500">{itemForm.formState.errors.valor.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contribuinte *</Label>
                  <Controller control={itemForm.control} name="contribuinte" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">Sim</SelectItem>
                        <SelectItem value="N">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>

              {/* CNPJ / Centro / UF */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">CNPJ / Código *</Label>
                  <Input placeholder="CNPJ ou código" {...itemForm.register("cnpjCod")} />
                  {itemForm.formState.errors.cnpjCod && <p className="text-xs text-red-500">{itemForm.formState.errors.cnpjCod.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Centro *</Label>
                  <Controller control={itemForm.control} name="centro" render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o CD" />
                      </SelectTrigger>
                      <SelectContent>
                        {centros.map((cd) => (
                          <SelectItem key={cd.codigo} value={cd.codigo}>{cd.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {itemForm.formState.errors.centro && <p className="text-xs text-red-500">{itemForm.formState.errors.centro.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">UF do cliente *</Label>
                  <Controller control={itemForm.control} name="clienteUF" render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS_BRASIL.map((uf) => (
                          <SelectItem key={uf.value} value={uf.value}>{uf.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {itemForm.formState.errors.clienteUF && <p className="text-xs text-red-500">{itemForm.formState.errors.clienteUF.message}</p>}
                </div>
              </div>

              {/* Grupo 2 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grupo 2 *</Label>
                <Input placeholder="Ex: GRP002" {...itemForm.register("grupo2")} />
                {itemForm.formState.errors.grupo2 && <p className="text-xs text-red-500">{itemForm.formState.errors.grupo2.message}</p>}
              </div>

              {/* Link pedido */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Link do pedido complementar *</Label>
                <Input placeholder="https://..." {...itemForm.register("linkPedidoCompl")} />
                {itemForm.formState.errors.linkPedidoCompl && <p className="text-xs text-red-500">{itemForm.formState.errors.linkPedidoCompl.message}</p>}
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full border-dashed border-gray-300 text-gray-600 hover:border-[#2E9B7C] hover:text-[#2E9B7C]"
                disabled={produtoStatus === "loading" || produtoStatus === "not_found" || itens.length >= 20}
              >
                <Plus size={15} /> Adicionar item à solicitação
              </Button>
            </form>

            {/* Footer */}
            {(() => {
              const valorTotal = itens.reduce((s, i) => s + Number(i.valor ?? 0), 0);
              const abaixoMinimo = minimoPitagoras > 0 && valorTotal < minimoPitagoras;
              return (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    {itens.length === 0
                      ? "Adicione ao menos 1 item para finalizar"
                      : (
                        <span>
                          {itens.length} item(ns)
                          {valorTotal > 0 && (
                            <span className="font-semibold" style={{ color: abaixoMinimo ? "#dc2626" : "#2E9B7C" }}>
                              {" "}· Total: {formatCurrency(valorTotal)}
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
                      style={{ backgroundColor: "#2E9B7C", color: "white" }}
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Finalizar ({itens.length} item{itens.length !== 1 ? "s" : ""})
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Visão detalhada ─────────────────────────────────────────────────── */
function ViewLiberacao({ solicitacao }: { solicitacao: SolicitacaoLiberacaoWithDetails }) {
  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Retorno</p>
          <div className="mt-1"><RetornoBadge retorno={solicitacao.retornoPlanejamento} /></div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Grupo</p>
          <p className="text-sm text-gray-700 mt-0.5">{solicitacao.grupo}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Contrato</p>
          <p className="text-sm text-gray-700 mt-0.5">{solicitacao.contrato}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Sistema / Ação</p>
          <p className="text-sm text-gray-700 mt-0.5">
            {SISTEMA_LABEL[solicitacao.moneyOuSalesforce] ?? solicitacao.moneyOuSalesforce}
            {" · "}
            {solicitacao.acao === "HABILITAR" ? "Habilitar" : "Desabilitar"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Representante</p>
          <p className="text-sm text-gray-700 mt-0.5">{solicitacao.representante}</p>
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
          {solicitacao.itens.map((item: LiberacaoItem, idx: number) => (
            <div key={item.id} className="px-4 py-3 space-y-2">
              {/* Cabeçalho do item */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                <p className="text-sm font-semibold text-gray-800 flex-1 min-w-0">
                  <span className="font-mono" style={{ color: "#16455C" }}>{item.codigo}</span>
                  <span className="text-gray-300 mx-1.5">—</span>
                  {item.descricao}
                  {item.contribuinte === "S" && (
                    <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Contribuinte</span>
                  )}
                </p>
              </div>

              {/* Campos detalhados em grid */}
              <div className="ml-7 grid grid-cols-2 gap-x-4 gap-y-1.5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">CNPJ / Código</p>
                  <p className="text-xs text-gray-700 font-mono mt-0.5">{item.cnpjCod}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Centro</p>
                  <p className="text-xs text-gray-700 mt-0.5">{item.centro}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">UF do Cliente</p>
                  <p className="text-xs text-gray-700 mt-0.5">{item.clienteUF}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Grupo 2</p>
                  <p className="text-xs text-gray-700 mt-0.5">{item.grupo2}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quantidade</p>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">{item.quantidade} un</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Valor</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#16455C" }}>{formatCurrency(item.valor)}</p>
                </div>
              </div>

              {/* Link pedido */}
              {item.linkPedidoCompl && (
                <div className="ml-7">
                  <a
                    href={item.linkPedidoCompl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate block"
                  >
                    🔗 {item.linkPedidoCompl}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
