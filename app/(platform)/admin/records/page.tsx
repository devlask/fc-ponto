import { TimeEntryList } from "@/components/admin/time-entry-list";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSnapshot } from "@/lib/admin-data";

export default async function AdminRecordsPage() {
  const snapshot = await getAdminSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium text-muted-foreground">Registros</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Linha completa de marcações</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Aqui ficam os registros gerais do time. O dashboard principal não mostra mais essa lista para manter a leitura rápida.
          </p>
        </CardContent>
      </Card>

      <TimeEntryList entries={snapshot.history} />
    </div>
  );
}
