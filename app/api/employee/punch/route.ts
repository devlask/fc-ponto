import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSignedStorageUrl } from "@/lib/storage";
import { entryTypeLabels, inferNextEntryType } from "@/lib/employee-time";
import type { EntryType } from "@/types";

const allowedEntryTypes = new Set<EntryType>(["entry", "pause", "return", "exit", "overtime"]);

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function extractIpAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

function calculateDistanceMeters(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
) {
  const earthRadius = 6371e3;
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const startLat = (start.lat * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLocationLabel(status: string) {
  if (status === "outside") return "Fora do geofence";
  if (status === "unknown") return "Geofence indisponível";
  return "Dentro do geofence";
}

export async function POST(request: NextRequest) {
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

  const formData = await request.formData();
  const latitudeValue = formData.get("latitude");
  const longitudeValue = formData.get("longitude");
  const accuracyValue = formData.get("accuracy");
  const deviceId = formData.get("deviceId");
  const deviceLabel = formData.get("deviceLabel");
  const selfie = formData.get("selfie");

  if (
    typeof latitudeValue !== "string" ||
    typeof longitudeValue !== "string" ||
    typeof accuracyValue !== "string" ||
    typeof deviceId !== "string" ||
    typeof deviceLabel !== "string" ||
    !(selfie instanceof File)
  ) {
    return NextResponse.json({ error: "Dados inválidos para o registro." }, { status: 400 });
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  const accuracy = Number(accuracyValue);

  if (![latitude, longitude, accuracy].every(Number.isFinite)) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  const [{ data: schedule }, { data: profile }] = await Promise.all([
    supabase
      .from("work_schedule_settings")
      .select("id, geofence_enabled, geofence_center_lat, geofence_center_lng, geofence_radius_meters")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .maybeSingle(),
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const { data: lastEntry } = await supabase
    .from("time_entries")
    .select("event_type")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const resolvedType = inferNextEntryType(((lastEntry?.event_type as EntryType | undefined) ?? null) as EntryType | null);

  if (!allowedEntryTypes.has(resolvedType)) {
    return NextResponse.json({ error: "Não foi possível definir o tipo do registro." }, { status: 400 });
  }

  const selfieBuffer = await selfie.arrayBuffer();
  const selfieHash = toHex(await crypto.subtle.digest("SHA-256", selfieBuffer));
  const timestamp = Date.now();
  const selfiePath = `${user.id}/${new Date(timestamp).toISOString().slice(0, 10)}/${timestamp}-${resolvedType}.jpg`;
  const ipAddress = extractIpAddress(request);
  const geofenceEnabled = Boolean(schedule?.geofence_enabled);

  let geofenceStatus = "unknown";
  let geofenceDistanceMeters: number | null = null;

  if (
    geofenceEnabled &&
    typeof schedule?.geofence_center_lat === "number" &&
    typeof schedule?.geofence_center_lng === "number"
  ) {
    geofenceDistanceMeters = calculateDistanceMeters(
      {
        lat: Number(schedule.geofence_center_lat),
        lng: Number(schedule.geofence_center_lng),
      },
      { lat: latitude, lng: longitude },
    );

    geofenceStatus = geofenceDistanceMeters <= Number(schedule.geofence_radius_meters) ? "inside" : "outside";
  }

  const { error: uploadError } = await supabase.storage.from("time-selfies").upload(selfiePath, selfieBuffer, {
    cacheControl: "3600",
    contentType: selfie.type || "image/jpeg",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: "Falha ao enviar a selfie." }, { status: 500 });
  }

  const { data: insertedEntry, error: insertError } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      schedule_setting_id: (schedule?.id as string | undefined) ?? null,
      event_type: resolvedType,
      latitude,
      longitude,
      accuracy_meters: accuracy,
      geofence_status: geofenceStatus,
      selfie_path: selfiePath,
      selfie_hash: selfieHash,
      ip_address: ipAddress,
      device_id: deviceId.slice(0, 120),
      device_label: deviceLabel.slice(0, 120),
      source: "pwa",
      metadata: {
        geofenceDistanceMeters,
        originalFileName: selfie.name,
        selfieSizeBytes: selfie.size,
        userAgent: request.headers.get("user-agent"),
      },
    })
    .select("id, event_type, recorded_at, is_overtime, geofence_status, selfie_path")
    .single();

  if (insertError) {
    await supabase.storage.from("time-selfies").remove([selfiePath]);
    return NextResponse.json({ error: "Falha ao gravar o registro no banco." }, { status: 500 });
  }

  const selfieUrl = await getSignedStorageUrl("time-selfies", typeof insertedEntry.selfie_path === "string" ? insertedEntry.selfie_path : selfiePath);

  return NextResponse.json({
    classification: insertedEntry.is_overtime ? "hora extra" : "horário normal",
    employeeName: (profile?.full_name as string | undefined) || user.email || "Usuário",
    entry: {
      deviceLabel: deviceLabel.slice(0, 120),
      employeeId: user.id,
      employeeName: (profile?.full_name as string | undefined) || user.email || "Usuário",
      id: insertedEntry.id,
      ipAddress: ipAddress || "Não informado",
      isOvertime: insertedEntry.is_overtime,
      location: {
        accuracy,
        label: getLocationLabel(insertedEntry.geofence_status),
        lat: latitude,
        lng: longitude,
      },
      selfiePath,
      selfieUrl,
      timestamp: insertedEntry.recorded_at,
      type: resolvedType,
    },
    geofenceStatus: insertedEntry.geofence_status,
    label: entryTypeLabels[resolvedType],
    ok: true,
    resolvedType,
    timestamp: insertedEntry.recorded_at,
  });
}
