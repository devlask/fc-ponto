import { ActiveWorkersList } from "@/components/admin/active-workers-list";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { MapCard } from "@/components/admin/map-card";
import { ReportExportCard } from "@/components/admin/report-export-card";
import { TimeEntryList } from "@/components/admin/time-entry-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminSnapshot } from "@/lib/admin-data";

export default async function AdminPage() {
  const snapshot = await getAdminSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-3">
            <Badge variant="info">realtime dashboard</Badge>
            <CardTitle className="text-3xl text-foreground sm:text-4xl">Visibilidade viva da operacao.</CardTitle>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Acompanhe equipe, histórico, aprovações e auditoria em uma operação conectada ao Supabase.
            </p>
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
                <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{card.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visao geral</TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="map">Mapa</TabsTrigger>
          <TabsTrigger value="reports">Relatorios</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <ActiveWorkersList workers={snapshot.activeWorkers} />
          <Card className="ink-chip border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Motor de jornada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Seg a qui: normal ate 18:00. Sexta: normal ate 17:00.",
                "Qualquer registro apos o limite configurado vira hora extra automaticamente.",
                "Jornadas separadas no mesmo dia continuam permitidas e auditadas.",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-border bg-white/58 p-4 text-sm leading-6 text-muted-foreground dark:bg-white/6">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <TimeEntryList entries={snapshot.history} />
        </TabsContent>
        <TabsContent value="logs">
          <AuditLogList logs={snapshot.auditLogs} />
        </TabsContent>
        <TabsContent value="map">
          <MapCard point={snapshot.activeWorkers[0]?.location ?? { accuracy: 0, label: "Sem dados", lat: 0, lng: 0 }} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportExportCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
