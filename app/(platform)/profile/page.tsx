import { User, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const user = authData.user;
  let profile: { full_name: string; role: string; email: string } | null = null;

  if (supabase && user) {
    const { data } = await supabase
      .from("users")
      .select("full_name, role, email")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Usuário";
  const displayEmail = profile?.email || user?.email || "Sem e-mail";
  const displayRole = profile?.role || "employee";

  return (
    <div className="grid gap-6">
      <Card className="ink-chip border-border">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/12 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-foreground">Perfil</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Dados da conta atualmente conectada.</p>
              </div>
            </div>
            <Badge variant="info" className="capitalize">
              {displayRole}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Nome</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{displayName}</p>
          </div>

          <div className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">E-mail</p>
            <p className="mt-2 text-base text-foreground">{displayEmail}</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Sessão autenticada no Supabase.</p>
            </div>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
