"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const SETORES = [
  { value: "PLANEJAMENTO", label: "Planejamento" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "OPERACOES", label: "Operações" },
  { value: "OUTRO", label: "Outro" },
];

export function LoginForm() {
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: "", email: "", password: "", setor: undefined },
  });

  async function onLogin(data: LoginInput) {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      window.location.href = "/home";
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: err instanceof Error ? err.message : "Verifique suas credenciais",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister(data: RegisterInput) {
    setIsLoading(true);
    try {
      await signUp(data.nome, data.email, data.password, data.setor);
      toast({ title: "Conta criada!", description: "Faça login para continuar." });
      registerForm.reset();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: err instanceof Error ? err.message : "Verifique os dados informados",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white col-end-1 rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="mb-6 flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold" style={{ color: "#16455C" }}>
          Bem-vindo
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Entre na sua conta ou crie uma nova
        </p>
      </div>

      <Tabs defaultValue="login">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="login" className="flex-1">
            Entrar
          </TabsTrigger>
          <TabsTrigger value="register" className="flex-1">
            Criar conta
          </TabsTrigger>
        </TabsList>

        {/* ── ABA LOGIN ── */}
        <TabsContent value="login">
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Senha</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...loginForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-xs text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10"
              style={{ backgroundColor: "#16455C", color: "white" }}
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              Entrar
            </Button>
          </form>
        </TabsContent>

        {/* ── ABA CADASTRO ── */}
        <TabsContent value="register">
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="reg-nome">Nome completo</Label>
              <Input
                id="reg-nome"
                placeholder="Seu nome"
                autoComplete="name"
                {...registerForm.register("nome")}
              />
              {registerForm.formState.errors.nome && (
                <p className="text-xs text-red-500">
                  {registerForm.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">E-mail</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-setor">Setor</Label>
              <Controller
                control={registerForm.control}
                name="setor"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="reg-setor">
                      <SelectValue placeholder="Selecione seu setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETORES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {registerForm.formState.errors.setor && (
                <p className="text-xs text-red-500">
                  {registerForm.formState.errors.setor.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Senha</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  {...registerForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-xs text-red-500">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10"
              style={{ backgroundColor: "#2E9B7C", color: "white" }}
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              Criar conta
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
