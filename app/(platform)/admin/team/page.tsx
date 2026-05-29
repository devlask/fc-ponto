import { InviteUserForm } from "@/components/admin/invite-user-form";
import { TeamTable } from "@/components/admin/team-table";
import { getAdminTeamData, requireAdminSession } from "@/lib/admin-data";

export default async function AdminTeamPage() {
  const session = await requireAdminSession();
  const { members } = await getAdminTeamData();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <InviteUserForm canSetAdmin={session.role === "admin"} />
      <TeamTable members={members} />
    </div>
  );
}
