import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DailyTimeline } from "@/components/employee/daily-timeline";
import { PunchPanel } from "@/components/employee/punch-panel";
import { employeeEntries } from "@/lib/mock-data";

export default function EmployeePage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-3">
            <Badge variant="success">trabalhando agora</Badge>
            <CardTitle className="text-3xl text-foreground sm:text-4xl">Registro de ponto simples, rapido e auditavel.</CardTitle>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Use botoes grandes, selfie ao vivo e GPS automatico para registrar jornadas separadas, inclusive
              hora extra noturna no mesmo dia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Status", value: "Em hora extra" },
              { label: "Local", value: "Instalacao externa" },
              { label: "Offline queue", value: "3 registros" },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-heading text-lg font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PunchPanel />
      <DailyTimeline entries={employeeEntries} />
    </div>
  );
}
