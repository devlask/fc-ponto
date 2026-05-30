import { NextResponse } from "next/server";
import { resolveUserRole } from "@/lib/admin-data";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
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

  const body = (await request.json().catch(() => null)) as {
    eventType?: "entry" | "exit";
    latitude?: string;
    longitude?: string;
    note?: string;
    reason?: string;
    recordedAt?: string;
  } | null;

  if (!body?.recordedAt || !body?.reason || (body.eventType !== "entry" && body.eventType !== "exit")) {
    return NextResponse.json({ error: "Dados inválidos para o ajuste." }, { status: 400 });
  }

  const { id } = await context.params;
  const latitude = body.latitude ? Number(body.latitude) : 0;
  const longitude = body.longitude ? Number(body.longitude) : 0;

  if (
    (body.latitude && !Number.isFinite(latitude)) ||
    (body.longitude && !Number.isFinite(longitude))
  ) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  const { data: schedule } = await supabase
    .from("work_schedule_settings")
    .select("id")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .maybeSingle();

  const { data: insertedEntry, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: id,
      schedule_setting_id: schedule?.id ?? null,
      event_type: body.eventType,
    recorded_at: new Date(body.recordedAt).toISOString(),
    latitude,
    longitude,
    accuracy_meters: 0,
    geofence_status: body.latitude && body.longitude ? "inside" : "unknown",
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
        note: body.note?.trim() || null,
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await recordAdminAudit({
    action: "admin_lancou_ajuste_manual",
    actorUserId: user.id,
    afterData: {
      event_type: body.eventType,
      note: body.note?.trim() || null,
      reason: body.reason,
      recorded_at: new Date(body.recordedAt).toISOString(),
    },
    targetId: insertedEntry?.id ?? null,
    targetTable: "time_entries",
  });

  return NextResponse.json({ ok: true });
}
