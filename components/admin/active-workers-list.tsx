import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActiveWorker } from "@/types";

function variantForStatus(status: ActiveWorker["status"]) {
  switch (status) {
    case "working":
      return "success";
    case "paused":
      return "info";
    case "overtime":
      return "warning";
    default:
      return "default";
  }
}

type ActiveWorkersListProps = {
  workers: ActiveWorker[];
};

export function ActiveWorkersList({ workers }: ActiveWorkersListProps) {
  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Funcionarios ativos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {workers.map((worker) => (
          <div key={worker.id} className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{worker.name}</p>
                <p className="text-sm text-muted-foreground">{worker.team}</p>
              </div>
              <Badge variant={variantForStatus(worker.status)}>{worker.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{worker.lastEvent}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {worker.location.label}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
