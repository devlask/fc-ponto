import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateWorkedMinutes } from "@/lib/time";
import { formatMinutes } from "@/lib/utils";
import type { TimeEntry, WorkState } from "@/types";

export const entryTypeLabels = {
  entry: "Entrada",
  pause: "Pausa",
  return: "Retorno",
  exit: "Saída",
  overtime: "Hora extra",
} as const;

export function inferNextEntryType(lastEntryType: TimeEntry["type"] | null): TimeEntry["type"] {
  if (lastEntryType === "entry" || lastEntryType === "return" || lastEntryType === "overtime") {
    return "exit";
  }

  if (lastEntryType === "pause") {
    return "return";
  }

  return "entry";
}

export const workStateLabels: Record<WorkState, string> = {
  working: "Trabalhando",
  paused: "Em pausa",
  overtime: "Em hora extra",
  off: "Fora do expediente",
};

export function badgeVariantForWorkState(state: WorkState) {
  if (state === "working") return "success";
  if (state === "paused") return "warning";
  if (state === "overtime") return "danger";
  return "info";
}

function getBusinessDateInTimeZone(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function getLocationLabel(status: string | null | undefined) {
  if (status === "outside") return "Fora do geofence";
  if (status === "unknown") return "Geofence indisponível";
  return "Dentro do geofence";
}

function mapDbEntryToTimeEntry(
  entry: Record<string, unknown>,
  employeeId: string,
  employeeName: string,
): TimeEntry {
  return {
    id: String(entry.id),
    employeeId,
    employeeName,
    type: String(entry.event_type) as TimeEntry["type"],
    timestamp: String(entry.recorded_at),
    location: {
      lat: Number(entry.latitude),
      lng: Number(entry.longitude),
      accuracy: Number(entry.accuracy_meters),
      label: getLocationLabel((entry.geofence_status as string | null | undefined) ?? "inside"),
    },
    isOvertime: Boolean(entry.is_overtime),
    ipAddress: typeof entry.ip_address === "string" ? entry.ip_address : "Não informado",
    deviceLabel: typeof entry.device_label === "string" ? entry.device_label : "Dispositivo não informado",
  };
}

function getCurrentWorkState(lastEntry: TimeEntry | null): WorkState {
  if (!lastEntry) return "off";
  if (lastEntry.type === "pause") return "paused";
  if (lastEntry.type === "exit") return "off";
  if (lastEntry.isOvertime || lastEntry.type === "overtime") return "overtime";
  return "working";
}

export type EmployeeTimeSnapshot = {
  businessDate: string;
  currentState: WorkState;
  employeeName: string;
  nextEntryType: TimeEntry["type"];
  recentEntries: TimeEntry[];
  role: string;
  summary: {
    normalMinutes: number;
    overtimeMinutes: number;
    totalMinutes: number;
  };
  summaryCards: Array<{ label: string; value: string }>;
  todayEntries: TimeEntry[];
};

export async function getEmployeeTimeSnapshot(supabase: SupabaseClient): Promise<EmployeeTimeSnapshot | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: schedule }] = await Promise.all([
    supabase.from("users").select("full_name, role").eq("id", user.id).maybeSingle(),
    supabase
      .from("work_schedule_settings")
      .select("timezone")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .maybeSingle(),
  ]);

  const employeeName =
    (profile?.full_name as string | undefined) ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined) ||
    user.email ||
    "Usuário";
  const role = (profile?.role as string | undefined) || "employee";
  const timeZone = (schedule?.timezone as string | undefined) || "America/Sao_Paulo";
  const businessDate = getBusinessDateInTimeZone(timeZone);

  const [todayResult, recentResult] = await Promise.all([
    supabase
      .from("time_entries")
      .select(
        "id, event_type, recorded_at, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime",
      )
      .eq("user_id", user.id)
      .eq("business_date", businessDate)
      .order("recorded_at", { ascending: true })
      .limit(50),
    supabase
      .from("time_entries")
      .select(
        "id, event_type, recorded_at, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime",
      )
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(60),
  ]);

  const todayEntries = (todayResult.data ?? []).map((entry) => mapDbEntryToTimeEntry(entry, user.id, employeeName));
  const recentEntries = [...(recentResult.data ?? [])]
    .reverse()
    .map((entry) => mapDbEntryToTimeEntry(entry, user.id, employeeName));

  const summary = calculateWorkedMinutes(todayEntries);
  const currentState = getCurrentWorkState(todayEntries.at(-1) ?? recentEntries.at(-1) ?? null);
  const nextEntryType = inferNextEntryType((todayEntries.at(-1) ?? recentEntries.at(-1) ?? null)?.type ?? null);

  return {
    businessDate,
    currentState,
    employeeName,
    nextEntryType,
    recentEntries,
    role,
    summary,
    summaryCards: [
      { label: "Horas normais", value: formatMinutes(summary.normalMinutes) },
      { label: "Horas extras", value: formatMinutes(summary.overtimeMinutes) },
      { label: "Total do dia", value: formatMinutes(summary.totalMinutes) },
    ],
    todayEntries,
  };
}
