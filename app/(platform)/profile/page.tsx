import { BellRing, ChevronRight, LogOut, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSignedStorageUrl } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getEmployeeRequestsSnapshot, getEmployeeTimeSnapshot } from "@/lib/employee-time";
import { formatMinutes } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const user = authData.user;
  let profile: { avatar_url?: string | null; full_name: string; role: string; email: string } | null = null;
  let avatarUrl: string | null = null;
  let toleranceMinutes = 10;
  let dailyRules:
    | Record<string, { enabled?: boolean; start?: string; end?: string }>
    | undefined;
  let summary = { normalMinutes: 0, overtimeMinutes: 0, totalMinutes: 0 };
  let requestsCount = 0;

  if (supabase && user) {
    const [{ data }, { data: schedule }, timeSnapshot, requestsSnapshot] = await Promise.all([
      supabase.from("users").select("full_name, role, email, avatar_url").eq("id", user.id).maybeSingle(),
      supabase
        .from("work_schedule_settings")
        .select("tolerance_minutes, daily_rules")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .maybeSingle(),
      getEmployeeTimeSnapshot(supabase),
      getEmployeeRequestsSnapshot(supabase),
    ]);

    profile = data;
    toleranceMinutes = typeof schedule?.tolerance_minutes === "number" ? schedule.tolerance_minutes : 10;
    dailyRules =
      schedule?.daily_rules && typeof schedule.daily_rules === "object"
        ? (schedule.daily_rules as Record<string, { enabled?: boolean; start?: string; end?: string }>)
        : undefined;
    summary = timeSnapshot?.summary ?? summary;
    requestsCount = requestsSnapshot?.requests.filter((request) => request.status === "pending").length ?? 0;
    avatarUrl = await getSignedStorageUrl("profile-avatars", typeof data?.avatar_url === "string" ? data.avatar_url : null);
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Usuário";
  const displayEmail = profile?.email || user?.email || "Sem e-mail";
  const displayRole = profile?.role || "employee";
  const roleLabel = displayRole === "admin" ? "Admin" : displayRole === "manager" ? "Gerente" : "Funcionário";

  const workDays = [
    { label: "Seg → Qui", value: `${dailyRules?.["1"]?.start ?? "08:00"} às ${dailyRules?.["1"]?.end ?? "18:00"}` },
    { label: "Sex", value: `${dailyRules?.["5"]?.start ?? "08:00"} às ${dailyRules?.["5"]?.end ?? "17:00"}` },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none bg-white/78 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-4">
            <AvatarUploader initialUrl={avatarUrl} name={displayName} />
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground">{displayName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {roleLabel} • FC Comunicação Visual
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{displayEmail}</p>
            </div>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(0,184,230,0.08),rgba(255,79,163,0.08),rgba(255,205,56,0.12))] p-4">
            <p className="text-sm font-medium text-muted-foreground">FC Comunicação Visual</p>
            <p className="mt-1 text-base font-medium text-foreground">Seu ponto, sua jornada e suas solicitações em um só lugar.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-[#f3fbff] p-4">
              <p className="text-sm text-muted-foreground">Dias trabalhados</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {Math.max(1, Math.round(summary.totalMinutes / 480))}
              </p>
            </div>
            <div className="rounded-[24px] bg-[#fff7de] p-4">
              <p className="text-sm text-muted-foreground">Horas extras mês</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{formatMinutes(summary.overtimeMinutes)}</p>
            </div>
            <div className="rounded-[24px] bg-[#fff2f8] p-4">
              <p className="text-sm text-muted-foreground">Solicitações abertas</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{requestsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/78 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Horário padrão</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Sua jornada</h2>
          </div>

          {workDays.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-[22px] bg-white/82 px-4 py-4">
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          ))}

          <div className="rounded-[22px] bg-white/82 px-4 py-4 text-sm text-muted-foreground">
            Tolerância de atraso: {toleranceMinutes} min
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/78 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-3 p-6">
          {[
            { icon: BellRing, label: "Notificações", value: "Em breve" },
            { icon: Sparkles, label: "Aparência", value: "Tema claro" },
            { icon: Smartphone, label: "Dispositivo", value: "PWA ativa" },
            { icon: ShieldCheck, label: "Segurança", value: "Sessão autenticada" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-[22px] bg-white/82 px-4 py-4">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{item.value}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-[22px] bg-white/82 px-4 py-4">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-danger" />
              <span className="text-sm font-medium text-foreground">Sair</span>
            </div>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
