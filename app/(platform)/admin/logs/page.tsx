import { redirect } from "next/navigation";

export default async function AdminLogsPage() {
  redirect("/admin/settings/audit");
}
