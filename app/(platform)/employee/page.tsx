import { redirect } from "next/navigation";
import { DailyTimeline } from "@/components/employee/daily-timeline";
import { PunchPanel } from "@/components/employee/punch-panel";
import { getEmployeeTimeSnapshot } from "@/lib/employee-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmployeePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const snapshot = await getEmployeeTimeSnapshot(supabase);

  if (!snapshot) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <PunchPanel
        currentState={snapshot.currentState}
        employeeName={snapshot.employeeName}
        nextEntryType={snapshot.nextEntryType}
        summaryCards={snapshot.summaryCards}
      />
      <DailyTimeline entries={snapshot.todayEntries} />
    </div>
  );
}
