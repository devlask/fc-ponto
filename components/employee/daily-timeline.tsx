import { Clock3, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeEntry } from "@/types";

function getEntryLabel(entry: TimeEntry) {
  if (entry.type === "entry") {
    return entry.isOvertime ? "Entrada extra" : "Entrada";
  }

  if (entry.type === "exit") {
    return entry.isOvertime ? "Saída extra" : "Saída";
  }

  if (entry.type === "overtime") {
    return "Hora extra";
  }

  if (entry.type === "pause") {
    return "Pausa";
  }

  return "Retorno";
}

type DailyTimelineProps = {
  entries: TimeEntry[];
  showEmployeeName?: boolean;
  title?: string;
};

export function DailyTimeline({
  entries,
  showEmployeeName = false,
  title = "Timeline do dia",
}: DailyTimelineProps) {
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
                  <p className="font-medium text-foreground">{getEntryLabel(entry)}</p>
                  {entry.isOvertime ? <Badge variant="warning">hora extra</Badge> : <Badge variant="info">normal</Badge>}
                </div>
                {showEmployeeName ? (
                  <p className="mt-2 text-sm font-medium text-foreground">{entry.employeeName}</p>
                ) : null}
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
                  Localização exata: {entry.location.lat.toFixed(5)}, {entry.location.lng.toFixed(5)} • precisão {entry.location.accuracy}m
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {entry.deviceLabel} • IP {entry.ipAddress}
                </p>
                {entry.selfieUrl ? (
                  <div className="mt-4 overflow-hidden rounded-[18px] border border-border bg-white/78 p-2 dark:bg-white/6">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.selfieUrl}
                        alt={`Selfie do registro de ${entry.employeeName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
