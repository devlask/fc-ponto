import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ActiveWorkersList } from "@/components/admin/active-workers-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/admin-data";

const toneClasses = {
  blue: "bg-[#eef6ff]",
  cyan: "bg-[#ecfbff]",
  magenta: "bg-[#fff2f8]",
  yellow: "bg-[#fff8de]",
} as const;

export default async function AdminPage() {
  const snapshot = await getAdminDashboardData();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-[32px] bg-white/76 p-6 shadow-[0_18px_42px_rgba(35,31,32,0.06)]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{snapshot.generatedAt}</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
            {snapshot.greeting}, gerente 👋
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Veja rápido quem está trabalhando, atrasado, em hora extra e o que precisa de aprovação agora.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {snapshot.cards.map((card) => (
            <Card key={card.label} className={`border-none ${toneClasses[card.tone]} shadow-none`}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solicitações pendentes</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">O que precisa de ação</h2>
              </div>
              <Button variant="ghost" className="rounded-full" asChild>
                <Link href="/admin/approvals">
                  Ver todas
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {snapshot.pendingRequests.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white/70 p-5 text-sm text-muted-foreground">
                Nenhuma solicitação aguardando aprovação.
              </div>
            ) : (
              snapshot.pendingRequests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-border bg-white/78 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{request.requesterName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {request.requestedEventType === "exit" ? "Saída" : "Entrada"} • {request.requestedDate}
                      </p>
                    </div>
                    <Badge variant="warning">Pendente</Badge>
                  </div>
                  <p className="mt-3 text-base font-medium text-foreground">{request.requestedTime}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.reason}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="rounded-xl" asChild>
                      <Link href="/admin/approvals">Aprovar</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" asChild>
                      <Link href="/admin/approvals">Recusar</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resumo do dia</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Leitura operacional</h2>
              </div>
            </div>

            <div className="space-y-3">
              {snapshot.quickSummary.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-[22px] p-4 ${
                    index === 0 ? "bg-[#eef8ff]" : index === 1 ? "bg-[#fff8de]" : "bg-[#fff2f8]"
                  }`}
                >
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" className="h-12 rounded-[20px]" asChild>
                <Link href="/admin/records">Ver registros</Link>
              </Button>
              <Button variant="secondary" className="h-12 rounded-[20px]" asChild>
                <Link href="/admin/reports">Abrir relatórios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <ActiveWorkersList workers={snapshot.activeWorkers.slice(0, 5)} />
        {snapshot.activeWorkers.length > 5 ? (
          <div className="flex justify-end">
            <Button variant="ghost" className="rounded-full" asChild>
              <Link href="/admin/team">
                Ver equipe completa
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
