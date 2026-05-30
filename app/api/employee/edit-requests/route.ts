import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();
  const body = (await request.json().catch(() => null)) as {
    date?: string;
    reason?: string;
    requestedEventType?: "entry" | "exit";
    requestedTime?: string;
  } | null;

  if (!body?.date || !body?.requestedTime || !body?.reason || !body?.requestedEventType) {
    return NextResponse.json({ error: "Dados incompletos para a solicitação." }, { status: 400 });
  }

  const requestedTimestamp = new Date(`${body.date}T${body.requestedTime}:00`);
  if (Number.isNaN(requestedTimestamp.getTime())) {
    return NextResponse.json({ error: "Data ou horário inválido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("edit_requests")
    .insert({
      user_id: user.id,
      requested_date: body.date,
      requested_event_type: body.requestedEventType,
      requested_timestamp: requestedTimestamp.toISOString(),
      reason: body.reason,
    })
    .select("id, requested_date, requested_timestamp, requested_event_type, reason, status, created_at, review_notes")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    request: {
      id: String(data.id),
      employeeName:
        (profile?.full_name as string | undefined) ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined) ||
        user.email ||
        "Usuário",
      requestedAt: String(data.created_at),
      date: String(data.requested_date),
      kind: String(data.reason).startsWith("[Hora extra] ")
        ? "overtime"
        : String(data.reason).startsWith("[Justificativa] ")
          ? "justification"
          : "adjust",
      reason: String(data.reason)
        .replace("[Hora extra] ", "")
        .replace("[Justificativa] ", "")
        .replace("[Ajuste de horário] ", ""),
      reviewNotes: typeof data.review_notes === "string" ? data.review_notes : null,
      status: String(data.status),
      requestedEventType: String(data.requested_event_type),
      requestedTime: new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(String(data.requested_timestamp))),
    },
  });
}
