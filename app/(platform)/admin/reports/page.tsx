import Link from "next/link";
import { ReportExportCard } from "@/components/admin/report-export-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSnapshot } from "@/lib/admin-data";

export default async function AdminReportsPage() {
  const snapshot = await getAdminSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Relatórios</p>
            <h1 className="font-heading text-3xl font-semibold text-foreground">Exportações e consolidados</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              PDF, Excel e leitura rápida de horas extras saem daqui, sem ocupar espaço no dashboard operacional.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="rounded-[20px]" asChild>
              <Link href="/admin/records">Ver registros base</Link>
            </Button>
            <Button variant="secondary" className="rounded-[20px]" asChild>
              <Link href="/admin/team">Abrir equipe</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportExportCard entries={snapshot.history} />
    </div>
  );
}
