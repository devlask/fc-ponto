"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { CompanyLogo } from "@/components/branding/company-logo";
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

  return (
    <main className="studio-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border bg-white/82 shadow-[0_24px_80px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:bg-card/92">
        <CardHeader className="space-y-5">
          <div className="flex justify-center">
            <CompanyLogo />
          </div>
          <div className="space-y-2 text-center">
            <Badge variant="info" className="mx-auto w-fit">
              acesso seguro
            </Badge>
            <CardTitle className="text-3xl text-foreground">Entrar</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">Acesse com seu e-mail e senha.</p>
          </div>
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

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80">
              Recuperar senha
            </Link>
            {!hasSupabaseEnv() && <Badge variant="warning">configuração pendente</Badge>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
