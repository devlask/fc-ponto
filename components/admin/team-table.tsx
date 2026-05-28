import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamMembers } from "@/lib/mock-data";

function badgeVariant(status: string) {
  if (status === "working") return "success";
  if (status === "paused") return "info";
  if (status === "overtime") return "warning";
  return "default";
}

export function TeamTable() {
  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Gestao de funcionarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="grid gap-3 rounded-[24px] border border-border bg-white/58 p-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr] dark:bg-white/6"
            >
              <div>
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.team}</p>
              </div>
              <p className="text-sm capitalize text-muted-foreground">{member.role}</p>
              <Badge variant={badgeVariant(member.status)}>{member.status}</Badge>
              <p className="text-sm text-muted-foreground">RLS ativo</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
