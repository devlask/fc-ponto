"use client";

import { useState } from "react";
import { PunchPanel } from "@/components/employee/punch-panel";
import type { EmployeePrimaryAction, EmployeeQuickSummary } from "@/lib/employee-time";
import type { TimeEntry, WorkState } from "@/types";

type EmployeeDashboardProps = {
  currentState: WorkState;
  employeeName: string;
  greeting: string;
  primaryAction: EmployeePrimaryAction;
  quickSummary: EmployeeQuickSummary;
  todayEntries: TimeEntry[];
};

export function EmployeeDashboard({
  currentState,
  employeeName,
  greeting,
  primaryAction,
  quickSummary,
  todayEntries: initialTodayEntries,
}: EmployeeDashboardProps) {
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>(initialTodayEntries);

  const handleRegistered = (entry: TimeEntry) => {
    setTodayEntries((current) => {
      const deduped = current.filter((item) => item.id !== entry.id);
      return [...deduped, entry];
    });
  };

  return (
    <PunchPanel
      currentState={currentState}
      employeeName={employeeName}
      greeting={greeting}
      onRegistered={handleRegistered}
      primaryAction={primaryAction}
      quickSummary={quickSummary}
      todayEntries={todayEntries}
    />
  );
}
