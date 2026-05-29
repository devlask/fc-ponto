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
      initialEntries={snapshot.recentEntries.slice(-8)}
      nextEntryType={snapshot.nextEntryType}
      summaryCards={snapshot.summaryCards}
      userId={snapshot.userId}
    />
  );
}
