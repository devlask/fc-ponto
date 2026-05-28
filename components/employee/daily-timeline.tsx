import { Clock3, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeEntry } from "@/types";

const labels = {
  entry: "Entrada",
  pause: "Pausa",
  return: "Retorno",
  exit: "Saida",
  overtime: "Hora extra",
};

type DailyTimelineProps = {
  entries: TimeEntry[];
  title?: string;
};

export function DailyTimeline({ entries, title = "Timeline do dia" }: DailyTimelineProps) {
  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-border bg-white/58 p-6 text-sm text-muted-foreground dark:bg-white/6">
            Nenhum registro encontrado ainda.
          </div>
        ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-4 rounded-[22px] border border-border bg-white/58 p-4 dark:bg-white/6">
              <div className="relative mt-1 flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div className="mt-2 h-full w-px bg-border" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{labels[entry.type]}</p>
                  {entry.isOvertime ? <Badge variant="warning">hora extra</Badge> : <Badge variant="info">normal</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(entry.timestamp))}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {entry.location.label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {entry.deviceLabel} • IP {entry.ipAddress}
                </p>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
