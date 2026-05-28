import { redirect } from "next/navigation";
import { DailyTimeline } from "@/components/employee/daily-timeline";
import { getEmployeeTimeSnapshot } from "@/lib/employee-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeHistoryPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const snapshot = await getEmployeeTimeSnapshot(supabase);

  if (!snapshot) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {snapshot.summaryCards.map((item) => (
          <Card key={item.label} className="ink-chip border-border">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="ink-chip border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-foreground">Histórico de registros</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Eventos reais salvos no Supabase com separação visual de horário normal e hora extra.
              </p>
            </div>
            <Badge variant="info">
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date())}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <DailyTimeline entries={snapshot.recentEntries} title="Últimos registros" />
    </div>
  );
}
