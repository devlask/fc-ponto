"use client";

import { useState } from "react";
import { DailyTimeline } from "@/components/employee/daily-timeline";
import { PunchPanel } from "@/components/employee/punch-panel";
import type { EntryType, TimeEntry, WorkState } from "@/types";

type EmployeeDashboardProps = {
  currentState: WorkState;
  employeeName: string;
  initialEntries: TimeEntry[];
  nextEntryType: EntryType;
  summaryCards: Array<{ label: string; value: string }>;
};

export function EmployeeDashboard({
  currentState,
  employeeName,
  initialEntries,
  nextEntryType,
  summaryCards,
}: EmployeeDashboardProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);

  const handleRegistered = (entry: TimeEntry) => {
    setEntries((current) => {
      const deduped = current.filter((item) => item.id !== entry.id);
      return [...deduped, entry].slice(-8);
    });
  };

  return (
    <div className="space-y-6">
      <PunchPanel
        currentState={currentState}
        employeeName={employeeName}
        nextEntryType={nextEntryType}
        summaryCards={summaryCards}
        onRegistered={handleRegistered}
      />
      <DailyTimeline entries={entries} title="Últimos registros" />
    </div>
  );
}
