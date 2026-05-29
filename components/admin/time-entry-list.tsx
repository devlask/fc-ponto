import { DailyTimeline } from "@/components/employee/daily-timeline";
import type { AdminTimeEntryRow } from "@/lib/admin-data";

type TimeEntryListProps = {
  entries: AdminTimeEntryRow[];
};

export function TimeEntryList({ entries }: TimeEntryListProps) {
  return <DailyTimeline entries={entries} showEmployeeName title="Histórico geral de registros" />;
}
