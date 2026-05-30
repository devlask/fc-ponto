import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ManualAdjustmentForm } from "@/components/admin/manual-adjustment-form";
import { TimeEntryList } from "@/components/admin/time-entry-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminEmployeeDetail } from "@/lib/admin-data";

export default async function AdminTeamMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const rawPeriod = query?.period;
  const periodDays =
    rawPeriod === "7" ? 7 : rawPeriod === "90" ? 90 : rawPeriod === "all" ? null : 30;
  const detail = await getAdminEmployeeDetail(id, periodDays);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" className="rounded-2xl" asChild>
          <Link href="/admin/team">
            <ChevronLeft className="h-4 w-4" />
            Voltar para equipe
          </Link>
        </Button>
        <Badge variant="info">{detail.role}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { href: `/admin/team/${detail.id}?period=7`, label: "7 dias", active: detail.periodDays === 7 },
          { href: `/admin/team/${detail.id}?period=30`, label: "30 dias", active: detail.periodDays === 30 },
          { href: `/admin/team/${detail.id}?period=90`, label: "90 dias", active: detail.periodDays === 90 },
          { href: `/admin/team/${detail.id}?period=all`, label: "Tudo", active: detail.periodDays === null },
        ].map((item) => (
          <Button
            key={item.href}
            type="button"
            variant={item.active ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            asChild
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden border-none bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(240,248,255,0.98))] shadow-[0_26px_72px_rgba(27,57,106,0.10)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Ficha do funcionário</p>
            <CardTitle className="text-3xl text-foreground">{detail.fullName}</CardTitle>
            <p className="text-sm text-muted-foreground">{detail.email}</p>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Visualização operacional com horas trabalhadas, atrasos, horas extras e histórico completo no período selecionado.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {detail.summaryCards.map((card, index) => (
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

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ManualAdjustmentForm userId={detail.id} />
        <Card className="ink-chip border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Leitura da jornada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "A marcação alterna automaticamente entre entrada e saída.",
              "Se houver uma entrada em aberto na virada do dia, o próximo toque continua sendo saída.",
              "Qualquer novo ciclo após uma saída volta a ser entrada.",
              "Horários fora do limite configurado continuam sinalizados como hora extra.",
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-border bg-white/58 p-4 text-sm leading-6 text-muted-foreground dark:bg-white/6">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <TimeEntryList entries={detail.entries} />
    </div>
  );
}
