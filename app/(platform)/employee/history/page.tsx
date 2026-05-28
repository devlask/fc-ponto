import { DailyTimeline } from "@/components/employee/daily-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeEntries, employeeStatusCards } from "@/lib/mock-data";

export default function EmployeeHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {employeeStatusCards.map((item) => (
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
              <CardTitle className="text-foreground">Historico completo</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Multiplos registros no mesmo dia com separacao visual de horas normais e extras.
              </p>
            </div>
            <Badge variant="info">15 mai 2026</Badge>
          </div>
        </CardHeader>
      </Card>

      <DailyTimeline entries={employeeEntries} title="Historico detalhado de hoje" />
    </div>
  );
}
