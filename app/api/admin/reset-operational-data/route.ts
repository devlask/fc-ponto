import { NextResponse } from "next/server";
import { recordAdminAudit } from "@/lib/admin-audit";
import { resolveUserRole } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Configuração administrativa indisponível." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const role = await resolveUserRole(user.id, user.user_metadata?.role, supabase);
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Service role do Supabase não configurada." }, { status: 500 });
  }

  const { data, error } = await adminClient.rpc("reset_operational_data");

  if (error) {
    return NextResponse.json({ error: "Falha ao resetar os dados operacionais." }, { status: 500 });
  }

  const counts =
    data && typeof data === "object"
      ? (data as Record<string, number>)
      : {
          auditLogs: 0,
          editRequests: 0,
          overtimeEntries: 0,
          storageObjects: 0,
          timeEntries: 0,
        };

  await recordAdminAudit({
    action: "admin_resetou_dados_operacionais",
    actorUserId: user.id,
    afterData: counts,
    targetTable: "system",
  });

  return NextResponse.json({ counts, ok: true });
}
