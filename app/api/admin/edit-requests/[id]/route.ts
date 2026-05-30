import { NextResponse } from "next/server";
import { resolveUserRole } from "@/lib/admin-data";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase indisponível." }, { status: 500 });
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

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: "approved" | "rejected" } | null;

  if (!body?.status) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const { data: requestRow } = await supabase
    .from("edit_requests")
    .select("id, requested_event_type, requested_date, requested_timestamp, status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("edit_requests")
    .update({
      reviewer_id: user.id,
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await recordAdminAudit({
    action: body.status === "approved" ? "admin_aprovou_solicitacao" : "admin_recusou_solicitacao",
    actorUserId: user.id,
    afterData: {
      requested_date: requestRow?.requested_date ?? null,
      requested_event_type: requestRow?.requested_event_type ?? null,
      requested_timestamp: requestRow?.requested_timestamp ?? null,
      status: body.status,
    },
    beforeData: {
      status: requestRow?.status ?? null,
    },
    targetId: id,
    targetTable: "edit_requests",
  });

  return NextResponse.json({ ok: true });
}
