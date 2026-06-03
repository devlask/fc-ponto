"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, LoaderCircle, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { CompanyLogo } from "@/components/branding/company-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionState = "checking" | "ready" | "missing";

export function CreatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setSessionState("missing");
      return;
    }

    let active = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSessionState(data.session ? "ready" : "missing");
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSessionState(session ? "ready" : "missing");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isInviteMode = mode === "invite";
  const title = isInviteMode ? "Crie sua senha" : "Definir nova senha";
  const description = isInviteMode
    ? "Você foi convidado para acessar o FC Comunicação Visual. Defina sua senha para concluir o primeiro acesso."
    : "Defina sua nova senha para voltar a acessar o sistema com segurança.";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      toast.error("Cliente Supabase indisponível.");
      return;
    }

    if (password.length < 8) {
      toast.error("Use pelo menos 8 caracteres na senha.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Senha criada com sucesso.");
    router.replace("/employee");
  };

  return (
    <main className="studio-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border bg-white/84 shadow-[0_24px_80px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:bg-card/92">
        <CardHeader className="space-y-5">
          <div className="flex justify-center">
            <CompanyLogo />
          </div>
          <div className="space-y-2 text-center">
            <Badge variant="info" className="mx-auto w-fit">
              acesso inicial
            </Badge>
            <CardTitle className="text-3xl text-foreground">{title}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {sessionState === "checking" ? (
            <div className="flex items-center justify-center gap-3 rounded-[24px] border border-border bg-white/70 px-4 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Validando convite...
            </div>
          ) : sessionState === "missing" ? (
            <div className="space-y-4 rounded-[24px] border border-amber-200 bg-amber-50/90 p-5">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-medium text-amber-900">Link inválido ou expirado</p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Abra novamente o link do e-mail de convite. Se continuar falhando, peça para o administrador reenviar o convite.
                  </p>
                </div>
              </div>
              <Link href="/auth/login" className="text-sm font-medium text-primary hover:text-primary/80">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo de 8 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <p>Depois de salvar a senha, seu acesso será liberado automaticamente.</p>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-[20px]" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Criar senha
                  </>
                )}
              </Button>

              <Link href="/auth/login" className="block text-center text-sm text-primary hover:text-primary/80">
                Voltar ao login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
