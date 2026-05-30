import { redirect } from "next/navigation";
import { JourneyDayView } from "@/components/employee/journey-day-view";
import { getEmployeeTimeSnapshot } from "@/lib/employee-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/utils";

export default async function EmployeeJourneyPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const snapshot = await getEmployeeTimeSnapshot(supabase);

  if (!snapshot) {
    redirect("/auth/login");
  }

  return (
    <JourneyDayView
      currentStateLabel={snapshot.quickSummary.status}
      entries={snapshot.todayEntries}
      firstEntry={snapshot.quickSummary.firstEntry}
      lastExit={snapshot.quickSummary.lastExit}
      overtime={snapshot.quickSummary.overtime}
      total={formatMinutes(snapshot.summary.totalMinutes)}
    />
  );
}
