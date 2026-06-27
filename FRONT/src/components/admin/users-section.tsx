"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Trash2, Loader2, Search, X, Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { adminUserCreateSchema, adminUserUpdateSchema } from "@/lib/validations/admin";
import type { AdminUserCreateInput, AdminUserUpdateInput } from "@/lib/validations/admin";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  nome: string;
  name: string;
  email: string;
  setor: string;
  role: string;
  createdAt: string;
}

const SETOR_OPTIONS = ["PLANEJAMENTO", "COMERCIAL", "OPERACOES", "OUTRO"] as const;
const ROLE_OPTIONS  = ["ADMIN", "USER"] as const;

const SETOR_LABELS: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  COMERCIAL:    "Comercial",
  OPERACOES:    "Operações",
  OUTRO:        "Outro",
};

/* ── Modal criar / editar ─────────────────────────────────────────────── */
interface UserModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: AdminUser | null; // null = criar
  onSuccess: () => void;
}

function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const isEdit = !!user;
  const [isLoading, setIsLoading] = useState(false);

  const createForm = useForm<AdminUserCreateInput>({
    resolver: zodResolver(adminUserCreateSchema),
    defaultValues: { nome: "", email: "", password: "", setor: "COMERCIAL", role: "USER" },
  });

  const editForm = useForm<AdminUserUpdateInput>({
    resolver: zodResolver(adminUserUpdateSchema),
  });

  useEffect(() => {
    if (!open) {
      createForm.reset();
      editForm.reset();
      return;
    }
    if (user) {
      editForm.reset({
        nome:  user.nome,
        email: user.email,
        setor: user.setor as AdminUserUpdateInput["setor"],
        role:  user.role  as AdminUserUpdateInput["role"],
      });
    }
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmitCreate(data: AdminUserCreateInput) {
    setIsLoading(true);
    try {
      await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(data) });
      toast({ title: "Usuário criado com sucesso!" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitEdit(data: AdminUserUpdateInput) {
    if (!user) return;
    setIsLoading(true);
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(data) });
      toast({ title: "Usuário atualizado com sucesso!" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {isEdit ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {isEdit ? (
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</Label>
              <Input {...editForm.register("nome")} />
              {editForm.formState.errors.nome && <p className="text-xs text-red-500">{editForm.formState.errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">E-mail</Label>
              <Input type="email" {...editForm.register("email")} />
              {editForm.formState.errors.email && <p className="text-xs text-red-500">{editForm.formState.errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Setor</Label>
                <Controller control={editForm.control} name="setor" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SETOR_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{SETOR_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Perfil</Label>
                <Controller control={editForm.control} name="role" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r === "ADMIN" ? "Administrador" : "Usuário"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#16455C", color: "white" }}>
                {isLoading && <Loader2 size={14} className="animate-spin" />} Salvar
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nome *</Label>
              <Input {...createForm.register("nome")} />
              {createForm.formState.errors.nome && <p className="text-xs text-red-500">{createForm.formState.errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">E-mail *</Label>
              <Input type="email" {...createForm.register("email")} />
              {createForm.formState.errors.email && <p className="text-xs text-red-500">{createForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Senha *</Label>
              <Input type="password" {...createForm.register("password")} />
              {createForm.formState.errors.password && <p className="text-xs text-red-500">{createForm.formState.errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Setor *</Label>
                <Controller control={createForm.control} name="setor" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {SETOR_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{SETOR_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {createForm.formState.errors.setor && <p className="text-xs text-red-500">{createForm.formState.errors.setor.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Perfil *</Label>
                <Controller control={createForm.control} name="role" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r === "ADMIN" ? "Administrador" : "Usuário"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {createForm.formState.errors.role && <p className="text-xs text-red-500">{createForm.formState.errors.role.message}</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" style={{ borderColor: "#d1d5db", color: "#374151" }} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#16455C", color: "white" }}>
                {isLoading && <Loader2 size={14} className="animate-spin" />} Criar usuário
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Seção principal ──────────────────────────────────────────────────── */
export function UsersSection() {
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: AdminUser[] }>("/admin/users");
      setUsers(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.setor.toLowerCase().includes(q)
    );
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "Usuário excluído com sucesso" });
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, e-mail ou setor..."
            className="pl-9 pr-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <Button
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          style={{ backgroundColor: "#16455C", color: "white" }}
        >
          <Plus size={15} /> Novo usuário
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <UsersIcon size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>E-mail</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Setor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Desde</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nome}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{SETOR_LABELS[u.setor] ?? u.setor}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                        style={u.role === "ADMIN"
                          ? { borderColor: "#16455C", color: "#16455C", backgroundColor: "#EBF5F9" }
                          : { borderColor: "#d1d5db", color: "#6b7280" }
                        }
                      >
                        {u.role === "ADMIN" ? "Admin" : "Usuário"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-[#16455C] hover:bg-[#EBF5F9]"
                          onClick={() => { setEditTarget(u); setModalOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} usuário(s)</p>

      {/* Modal criar/editar */}
      <UserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={editTarget}
        onSuccess={load}
      />

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              style={{ backgroundColor: "#dc2626", color: "white" }}
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
