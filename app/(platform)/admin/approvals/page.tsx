import { ApprovalsBoard } from "@/components/admin/approvals-board";
import { getAdminApprovalsData } from "@/lib/admin-data";

export default async function AdminApprovalsPage() {
  const { requests } = await getAdminApprovalsData();

  return <ApprovalsBoard requests={requests} />;
}
