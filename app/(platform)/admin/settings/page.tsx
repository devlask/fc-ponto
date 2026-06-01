import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResetOperationalDataCard } from "@/components/admin/reset-operational-data-card";
import { ScheduleSettingsPanel } from "@/components/admin/schedule-settings-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <ScheduleSettingsPanel />
      <ResetOperationalDataCard />

      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Auditoria</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Logs e trilha imutável</h2>
            <p className="mt-1 text-sm text-muted-foreground">Abra os eventos auditáveis da operação em uma tela separada.</p>
          </div>
          <ButtonLikeAuditLink />
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonLikeAuditLink() {
  return (
    <Link
      href="/admin/settings/audit"
      className="inline-flex items-center gap-2 rounded-[20px] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(0,194,232,0.18)]"
    >
      <ShieldCheck className="h-4 w-4" />
      Abrir auditoria
    </Link>
  );
}
