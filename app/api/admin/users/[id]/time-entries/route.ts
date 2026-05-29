import { NextResponse } from "next/server";
import { resolveUserRole } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const actorRole = await resolveUserRole(user.id, user.user_metadata?.role, supabase);
  if (actorRole !== "manager" && actorRole !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    eventType?: "entry" | "exit";
    reason?: string;
    recordedAt?: string;
  } | null;

  if (!body?.recordedAt || !body?.reason || (body.eventType !== "entry" && body.eventType !== "exit")) {
    return NextResponse.json({ error: "Dados inválidos para o ajuste." }, { status: 400 });
  }

  const { id } = await context.params;
  const { data: schedule } = await adminClient
    .from("work_schedule_settings")
    .select("id")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .maybeSingle();

  const { error } = await adminClient.from("time_entries").insert({
    user_id: id,
    schedule_setting_id: schedule?.id ?? null,
    event_type: body.eventType,
    recorded_at: new Date(body.recordedAt).toISOString(),
    latitude: 0,
    longitude: 0,
    accuracy_meters: 0,
    geofence_status: "unknown",
    selfie_path: "admin/manual-adjustment",
    selfie_hash: null,
    ip_address: null,
    device_id: `admin-${user.id}`,
    device_label: "Ajuste manual administrativo",
    source: "admin",
    is_manual: true,
    metadata: {
      reason: body.reason,
      adjustedBy: user.id,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
