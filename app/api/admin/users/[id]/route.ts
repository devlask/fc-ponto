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
    return NextResponse.json({ error: "Configuração administrativa indisponível." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const actorRole = await resolveUserRole(user.id, user.user_metadata?.role, supabase);
  if (actorRole !== "manager" && actorRole !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { fullName?: string } | null;
  const fullName = body?.fullName?.trim();

  if (!fullName) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const { id } = await context.params;
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await recordAdminAudit({
    action: "admin_editou_usuario",
    actorUserId: user.id,
    afterData: {
      email: targetUser?.email ?? null,
      full_name: fullName,
    },
    beforeData: {
      email: targetUser?.email ?? null,
      full_name: targetUser?.full_name ?? null,
    },
    targetId: id,
    targetTable: "users",
  });

  return NextResponse.json({ ok: true });
}
