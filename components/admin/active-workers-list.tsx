import Link from "next/link";
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

function statusLabel(status: ActiveWorker["status"]) {
  if (status === "working") return "Trabalhando";
  if (status === "paused") return "Em pausa";
  if (status === "overtime") return "Hora extra";
  return "Fora";
}

type ActiveWorkersListProps = {
  workers: ActiveWorker[];
};

export function ActiveWorkersList({ workers }: ActiveWorkersListProps) {
  return (
    <Card className="ink-chip border-border">
      <CardHeader className="space-y-2">
        <CardTitle className="text-foreground">Funcionarios ativos</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Acompanhe quem está em campo agora e abra a ficha individual quando precisar agir.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {workers.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-border bg-white/62 p-5 text-sm text-muted-foreground dark:bg-white/6">
            Nenhum funcionário ativo agora.
          </div>
        ) : null}

        {workers.map((worker) => (
          <Link
            key={worker.id}
            href={`/admin/team/${worker.id}`}
            className="block rounded-[26px] border border-border bg-white/62 p-5 transition-transform hover:-translate-y-0.5 dark:bg-white/6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{worker.name}</p>
                <p className="text-sm text-muted-foreground">{worker.team}</p>
              </div>
              <Badge variant={variantForStatus(worker.status)}>{statusLabel(worker.status)}</Badge>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{worker.lastEvent}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {worker.location.label}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
