import { AuditLogList } from "@/components/admin/audit-log-list";
import { TimeEntryList } from "@/components/admin/time-entry-list";
import { getAdminSnapshot } from "@/lib/admin-data";

export default async function AdminLogsPage() {
  const snapshot = await getAdminSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <TimeEntryList entries={snapshot.history} />
      <AuditLogList logs={snapshot.auditLogs} />
    </div>
  );
}
