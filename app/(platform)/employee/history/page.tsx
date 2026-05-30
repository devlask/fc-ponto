import { redirect } from "next/navigation";
import { HistoryGroupedView } from "@/components/employee/history-grouped-view";
import { getEmployeeTimeSnapshot } from "@/lib/employee-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmployeeHistoryPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const snapshot = await getEmployeeTimeSnapshot(supabase);

  if (!snapshot) {
    redirect("/auth/login");
  }

  return <HistoryGroupedView entries={snapshot.recentEntries} />;
}
