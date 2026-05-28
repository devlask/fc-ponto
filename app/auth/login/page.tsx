"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Informe um email valido"),
  password: z.string().min(6, "Minimo de 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    if (!hasSupabaseEnv()) {
      toast.message("Sem Supabase configurado. Use o acesso demo abaixo.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Cliente Supabase indisponivel.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Login realizado.");
    router.push("/employee");
  };

  const enterDemo = (path: "/employee" | "/admin") => {
    startTransition(() => router.push(path));
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-3">
          <Badge variant="info" className="w-fit">
            acesso seguro
          </Badge>
          <CardTitle className="text-3xl text-foreground">Entrar no FC Ponto</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Login com Supabase Auth, roles de funcionario, gerente e admin, alem de recuperacao de senha.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="voce@fcvisual.com.br" {...form.register("email")} />
              <p className="text-xs text-danger">{form.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
              <p className="text-xs text-danger">{form.formState.errors.password?.message}</p>
            </div>
            <Button type="submit" className="w-full rounded-[20px]" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="space-y-3 rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <p className="text-sm text-muted-foreground">Modo demonstracao rapido</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" className="rounded-[20px]" onClick={() => enterDemo("/employee")}>
                Entrar como funcionario
              </Button>
              <Button type="button" variant="secondary" className="rounded-[20px]" onClick={() => enterDemo("/admin")}>
                Entrar como gerente/admin
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80">
              Recuperar senha
            </Link>
            {!hasSupabaseEnv() && <Badge variant="warning">backend pendente</Badge>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
