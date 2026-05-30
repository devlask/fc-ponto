import { ApprovalsBoard } from "@/components/admin/approvals-board";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminApprovalsData } from "@/lib/admin-data";

export default async function AdminApprovalsPage() {
  const { requests } = await getAdminApprovalsData();

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium text-muted-foreground">Solicitações</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Revisões pendentes e histórico de decisão</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            A home mostra só um recorte. Aqui você decide tudo com mais contexto e sem poluir o dashboard.
          </p>
        </CardContent>
      </Card>

      <ApprovalsBoard requests={requests} />
    </div>
  );
}
