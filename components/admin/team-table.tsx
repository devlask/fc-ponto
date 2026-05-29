import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTeamMember } from "@/lib/admin-data";

function badgeVariant(status: AdminTeamMember["status"]) {
  if (status === "working") return "success";
  if (status === "paused") return "info";
  if (status === "overtime") return "warning";
  return "default";
}

type TeamTableProps = {
  members: AdminTeamMember[];
};

export function TeamTable({ members }: TeamTableProps) {
  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Gestao de funcionarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="grid gap-3 rounded-[24px] border border-border bg-white/58 p-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.9fr] dark:bg-white/6"
            >
              <div>
                <p className="font-medium text-foreground">{member.fullName}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <p className="text-sm capitalize text-muted-foreground">{member.role}</p>
              <Badge variant={badgeVariant(member.status)}>{member.status}</Badge>
              <p className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(member.createdAt))}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
