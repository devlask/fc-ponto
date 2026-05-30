import { AuditLogList } from "@/components/admin/audit-log-list";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSnapshot } from "@/lib/admin-data";

export default async function AdminAuditPage() {
  const snapshot = await getAdminSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium text-muted-foreground">Auditoria</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Logs da operação</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            A trilha de auditoria foi movida para configurações para não poluir a home administrativa.
          </p>
        </CardContent>
      </Card>

      <AuditLogList logs={snapshot.auditLogs} />
    </div>
  );
}
