"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";
import { calculateWorkedMinutes } from "@/lib/time";
import type { TimeEntry } from "@/types";

type HistoryGroupedViewProps = {
  entries: TimeEntry[];
};

type FilterKey = "today" | "week" | "month";

function getLabel(entry: TimeEntry) {
  if (entry.type === "exit") return entry.isOvertime ? "Saída extra" : "Saída";
  return entry.isOvertime ? "Entrada extra" : "Entrada";
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function entryDayKey(entry: TimeEntry) {
  return entry.businessDate || dayKey(new Date(entry.timestamp));
}

function isSameFilterRange(date: Date, filter: FilterKey) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "today") {
    return dayKey(date) === dayKey(now);
  }

  if (filter === "week") {
    return date.getTime() >= startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000;
  }

  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getPresenceRate(entries: TimeEntry[]) {
  const days = new Set(entries.map((entry) => dayKey(new Date(entry.timestamp)))).size;
  const now = new Date();
  const totalDays = now.getDate();
  return totalDays === 0 ? 0 : Math.round((days / totalDays) * 100);
}

export function HistoryGroupedView({ entries }: HistoryGroupedViewProps) {
  const [filter, setFilter] = useState<FilterKey>("month");

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        isSameFilterRange(new Date(`${entryDayKey(entry)}T12:00:00`), filter),
      ),
    [entries, filter],
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimeEntry[]>();

    for (const entry of filteredEntries) {
      const key = entryDayKey(entry);
      const current = groups.get(key) ?? [];
      current.push(entry);
      groups.set(key, current);
    }

    return [...groups.entries()]
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([key, items]) => ({
        key,
        items: items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      }));
  }, [filteredEntries]);

  const summary = calculateWorkedMinutes(filteredEntries);
  const daysWorked = new Set(filteredEntries.map((entry) => entryDayKey(entry))).size;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date())}
              </p>
              <h2 className="mt-1 font-heading text-3xl font-semibold text-foreground">Histórico</h2>
            </div>
            <div className="flex gap-2">
              {[
                { key: "today", label: "Hoje" },
                { key: "week", label: "Semana" },
                { key: "month", label: "Mês" },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={filter === item.key ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter(item.key as FilterKey)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-[#f3fbff] p-4">
              <p className="text-sm text-muted-foreground">Dias trabalhados</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{daysWorked}</p>
            </div>
            <div className="rounded-[24px] bg-[#fff7de] p-4">
              <p className="text-sm text-muted-foreground">Horas extras</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{formatMinutes(summary.overtimeMinutes)}</p>
            </div>
            <div className="rounded-[24px] bg-[#eef7ff] p-4">
              <p className="text-sm text-muted-foreground">Presença</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{getPresenceRate(filteredEntries)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groupedEntries.length === 0 ? (
          <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
            <CardContent className="p-6 text-sm text-muted-foreground">Nenhum registro encontrado nesse período.</CardContent>
          </Card>
        ) : (
          groupedEntries.map((group) => {
            const groupSummary = calculateWorkedMinutes(group.items);
            return (
              <Card key={group.key} className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(group.key))}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.items.length} marcação(ões)
                      </p>
                    </div>
                    {groupSummary.overtimeMinutes > 0 ? (
                      <Badge variant="warning">+{formatMinutes(groupSummary.overtimeMinutes)} extras</Badge>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {group.items.map((entry) => (
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
                            <p className="font-medium text-foreground">{getLabel(entry)}</p>
                            <p className="font-heading text-xl font-semibold text-foreground">
                              {new Intl.DateTimeFormat("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(entry.timestamp))}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{entry.location.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
