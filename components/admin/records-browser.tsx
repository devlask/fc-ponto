"use client";

import { useMemo, useState } from "react";
import { TimeEntryList } from "@/components/admin/time-entry-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminTimeEntryRow } from "@/lib/admin-data";

type RecordsBrowserProps = {
  entries: AdminTimeEntryRow[];
};

function toDateInputValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function toMonthInputValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

export function RecordsBrowser({ entries }: RecordsBrowserProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState(toMonthInputValue(new Date()));
  const [employeeId, setEmployeeId] = useState("all");

  const employees = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      if (!map.has(entry.employeeId)) {
        map.set(entry.employeeId, entry.employeeName);
      }
    }

    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const date = new Date(entry.timestamp);
      const entryDay = toDateInputValue(date);
      const entryMonth = toMonthInputValue(date);

      if (employeeId !== "all" && entry.employeeId !== employeeId) {
        return false;
      }

      if (day && entryDay !== day) {
        return false;
      }

      if (!day && month && entryMonth !== month) {
        return false;
      }

      return true;
    });
  }, [day, employeeId, entries, month]);

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Filtros rápidos</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Dia, mês e funcionário</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-[20px]"
              onClick={() => {
                setDay("");
                setMonth(toMonthInputValue(new Date()));
                setEmployeeId("all");
              }}
            >
              Limpar filtros
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Dia exato</span>
              <input
                type="date"
                value={day}
                onChange={(event) => setDay(event.target.value)}
                className="h-12 w-full rounded-[18px] border border-border bg-white/80 px-4 text-sm text-foreground outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Mês</span>
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                disabled={Boolean(day)}
                className="h-12 w-full rounded-[18px] border border-border bg-white/80 px-4 text-sm text-foreground outline-none disabled:opacity-50"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Funcionário</span>
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="h-12 w-full rounded-[18px] border border-border bg-white/80 px-4 text-sm text-foreground outline-none"
              >
                <option value="all">Todos</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[20px] bg-[#eef8ff] px-4 py-3 text-sm text-foreground">
            {filteredEntries.length} registro(s) encontrado(s)
          </div>
        </CardContent>
      </Card>

      <TimeEntryList entries={filteredEntries} />
    </div>
  );
}
