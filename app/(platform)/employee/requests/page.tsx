import { redirect } from "next/navigation";
import { RequestsHub } from "@/components/employee/requests-hub";
import { getEmployeeRequestsSnapshot } from "@/lib/employee-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmployeeRequestsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const snapshot = await getEmployeeRequestsSnapshot(supabase);

  if (!snapshot) {
    redirect("/auth/login");
  }

  return <RequestsHub initialRequests={snapshot.requests} />;
}
