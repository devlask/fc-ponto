import { ActiveWorkersList } from "@/components/admin/active-workers-list";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { MapCard } from "@/components/admin/map-card";
import { ReportExportCard } from "@/components/admin/report-export-card";
import { TimeEntryList } from "@/components/admin/time-entry-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getAdminSnapshot } from "@/lib/admin-data";

export default async function AdminPage() {
  const snapshot = await getAdminSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(240,248,255,0.98))] shadow-[0_26px_72px_rgba(27,57,106,0.10)]">
        <CardContent className="grid gap-8 p-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div className="space-y-4">
            <Badge variant="info">Central administrativa</Badge>
            <CardTitle className="text-3xl text-foreground sm:text-4xl">
              Operação, equipe e auditoria em tempo real.
            </CardTitle>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Acompanhe funcionários ativos, registros recentes, solicitações de ajuste e exportações com uma leitura
              mais executiva e menos fragmentada.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Equipe e nomes atualizáveis direto no painel.",
                "Histórico geral com nome do funcionário e contexto do registro.",
                "Relatórios reais prontos para PDF e Excel.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-border bg-white/68 p-4 text-sm leading-6 text-muted-foreground dark:bg-white/6"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.cards.map((card, index) => (
              <div
                key={card.label}
                className={
                  index % 3 === 0
                    ? "rounded-[24px] border border-primary/15 bg-primary/8 p-4"
                    : index % 3 === 1
                      ? "rounded-[24px] border border-secondary/15 bg-secondary/8 p-4"
                      : "rounded-[24px] border border-accent/20 bg-accent/15 p-4"
                }
              >
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{card.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ActiveWorkersList workers={snapshot.activeWorkers} />
        <MapCard point={snapshot.activeWorkers[0]?.location ?? { accuracy: 0, label: "Sem dados", lat: 0, lng: 0 }} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TimeEntryList entries={snapshot.history} />
        <AuditLogList logs={snapshot.auditLogs} />
      </div>

      <ReportExportCard entries={snapshot.history} />
    </div>
  );
}
