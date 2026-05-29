import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAuditLog } from "@/lib/admin-data";

type AuditLogListProps = {
  logs: AdminAuditLog[];
};

export function AuditLogList({ logs }: AuditLogListProps) {
  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Logs de auditoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-border bg-white/60 p-6 text-sm text-muted-foreground dark:bg-white/6">
            Nenhum log encontrado.
          </div>
        ) : null}
        {logs.map((log) => (
          <div key={log.id} className="rounded-[22px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-foreground">{log.actorName}</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {log.action} em <span className="font-medium text-foreground">{log.targetTable}</span>
            </p>
            {log.targetId ? <p className="mt-1 text-xs text-muted-foreground">ID: {log.targetId}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
