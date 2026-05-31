"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TimeEntry } from "@/types";

type JourneyDayViewProps = {
  currentStateLabel: string;
  entries: TimeEntry[];
  firstEntry: string | null;
  lastExit: string | null;
  overtime: string;
  timeZone: string;
  total: string;
};

function getEntryLabel(entry: TimeEntry) {
  if (entry.type === "exit") return entry.isOvertime ? "Saída extra" : "Saída";
  return entry.isOvertime ? "Entrada extra" : "Entrada";
}

export function JourneyDayView({ currentStateLabel, entries, firstEntry, lastExit, overtime, timeZone, total }: JourneyDayViewProps) {
  return (
    <div className="space-y-5">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hoje</p>
              <h2 className="mt-1 font-heading text-3xl font-semibold text-foreground">Minha jornada</h2>
            </div>
            <Badge variant="info">{currentStateLabel}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] bg-[#f3fbff] p-4">
              <p className="text-sm text-muted-foreground">Entrada</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{firstEntry ?? "—"}</p>
            </div>
            <div className="rounded-[24px] bg-[#fff2f8] p-4">
              <p className="text-sm text-muted-foreground">Saída</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{lastExit ?? "—"}</p>
            </div>
            <div className="rounded-[24px] bg-[#fff7de] p-4">
              <p className="text-sm text-muted-foreground">Horas extras</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{overtime}</p>
            </div>
            <div className="rounded-[24px] bg-[#eef7ff] p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Hoje</p>
            <h3 className="mt-1 font-heading text-2xl font-semibold text-foreground">Linha da jornada</h3>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma marcação registrada hoje.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4">
                <div className="flex w-7 justify-center pt-1">
                  <span
                    className={`h-3.5 w-3.5 rounded-full ${
                      entry.type === "exit"
                        ? "bg-[#ff4fa3]"
                        : entry.isOvertime
                          ? "bg-[#ffcd38]"
                          : "bg-[#00b8e6]"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1 rounded-[20px] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{getEntryLabel(entry)}</p>
                    <p className="font-heading text-xl font-semibold text-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone,
                      }).format(new Date(entry.timestamp))}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.location.label}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
