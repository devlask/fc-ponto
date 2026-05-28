import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { editRequests } from "@/lib/mock-data";

export default function AdminApprovalsPage() {
  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Aprovacoes de alteracao de ponto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editRequests.map((request) => (
          <div key={request.id} className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{request.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {request.date} • {request.requestedTime}
                </p>
              </div>
              <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>
                {request.status}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.reason}</p>
            <div className="mt-4 flex gap-2">
              <Button type="button" className="rounded-[20px]">
                Aprovar
              </Button>
              <Button type="button" variant="outline" className="rounded-[20px]">
                Rejeitar
              </Button>
              <Button type="button" variant="ghost" className="rounded-[20px]">
                Editar registro
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
