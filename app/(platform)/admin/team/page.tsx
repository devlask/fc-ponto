import { InviteUserForm } from "@/components/admin/invite-user-form";
import { TeamTable } from "@/components/admin/team-table";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminTeamData, requireAdminSession } from "@/lib/admin-data";

export default async function AdminTeamPage() {
  const session = await requireAdminSession();
  const { members } = await getAdminTeamData();

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium text-muted-foreground">Equipe</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Quem está em campo e quem precisa de ação</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Abra a ficha individual, ajuste nomes e acompanhe o estado operacional do time sem depender do dashboard principal.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <InviteUserForm canSetAdmin={session.role === "admin"} />
        <TeamTable members={members} />
      </div>
    </div>
  );
}
