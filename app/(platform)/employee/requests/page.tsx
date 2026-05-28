import { RequestEditForm } from "@/components/employee/request-edit-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { editRequests } from "@/lib/mock-data";

function badgeForStatus(status: string) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export default function EmployeeRequestsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <RequestEditForm />

      <Card className="ink-chip border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Status das solicitacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editRequests.map((request) => (
            <div key={request.id} className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{request.date}</p>
                  <p className="text-sm text-muted-foreground">{request.requestedTime}</p>
                </div>
                <Badge variant={badgeForStatus(request.status)}>{request.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{request.reason}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Solicitado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.requestedAt))}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
