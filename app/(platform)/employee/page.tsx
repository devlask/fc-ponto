import { redirect } from "next/navigation";
import { EmployeeDashboard } from "@/components/employee/employee-dashboard";
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
    <EmployeeDashboard
      currentState={snapshot.currentState}
      employeeName={snapshot.employeeName}
      greeting={snapshot.greeting}
      primaryAction={snapshot.primaryAction}
      quickSummary={snapshot.quickSummary}
      todayEntries={snapshot.todayEntries}
    />
  );
}
