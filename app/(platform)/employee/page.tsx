import { redirect } from "next/navigation";
import { DailyTimeline } from "@/components/employee/daily-timeline";
import { PunchPanel } from "@/components/employee/punch-panel";
import { badgeVariantForWorkState, getEmployeeTimeSnapshot, workStateLabels } from "@/lib/employee-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default async function EmployeePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const snapshot = await getEmployeeTimeSnapshot(supabase);

  if (!snapshot) {
    redirect("/auth/login");
  }

  const lastEntry = snapshot.todayEntries.at(-1) ?? snapshot.recentEntries.at(-1) ?? null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-3">
            <Badge variant={badgeVariantForWorkState(snapshot.currentState)}>{workStateLabels[snapshot.currentState].toLowerCase()}</Badge>
            <CardTitle className="text-3xl text-foreground sm:text-4xl">Registro de ponto</CardTitle>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {snapshot.employeeName}, use a câmera e o GPS para registrar entrada, pausa, retorno, saída ou hora extra.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Status", value: workStateLabels[snapshot.currentState] },
              {
                label: "Último registro",
                value: lastEntry
                  ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastEntry.timestamp))
                  : "Nenhum",
              },
              { label: "Geofence", value: lastEntry?.location.label || "Aguardando GPS" },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-heading text-lg font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PunchPanel summaryCards={snapshot.summaryCards} />
      <DailyTimeline entries={snapshot.todayEntries} />
    </div>
  );
}
