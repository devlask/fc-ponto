import { NextResponse } from "next/server";
import { resolveUserRole } from "@/lib/admin-data";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  if (!supabase || !adminClient) {
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

  const body = (await request.json().catch(() => null)) as { email?: string; fullName?: string; role?: string } | null;

  if (!body?.email || !body?.fullName || !body?.role) {
    return NextResponse.json({ error: "Dados incompletos para o convite." }, { status: 400 });
  }

  if (body.role === "admin" && role !== "admin") {
    return NextResponse.json({ error: "Somente admin pode convidar outro admin." }, { status: 403 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
  const redirectTo = origin ? `${origin}/auth/login` : undefined;

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(body.email, {
    data: {
      full_name: body.fullName,
      role: body.role,
    },
    redirectTo,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await recordAdminAudit({
    action: "admin_convidou_usuario",
    actorUserId: user.id,
    afterData: {
      email: body.email,
      full_name: body.fullName,
      role: body.role,
    },
    targetId: data.user?.id ?? null,
    targetTable: "users",
  });

  return NextResponse.json({ ok: true });
}
