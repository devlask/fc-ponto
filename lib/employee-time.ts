import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { resolveAddressLabel } from "@/lib/geocoding";
import { defaultSchedule } from "@/lib/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSignedStorageUrl } from "@/lib/storage";
import { calculateWorkedMinutes } from "@/lib/time";
import { formatMinutes } from "@/lib/utils";
import type { EditRequest, TimeEntry, WorkState } from "@/types";

export const entryTypeLabels = {
  entry: "Entrada",
  pause: "Pausa",
  return: "Retorno",
  exit: "Saída",
  overtime: "Hora extra",
} as const;

export function inferNextEntryType(lastEntryType: TimeEntry["type"] | null): TimeEntry["type"] {
  if (lastEntryType && lastEntryType !== "exit") {
    return "exit";
  }

  return "entry";
}

export const workStateLabels: Record<WorkState, string> = {
  working: "Trabalhando",
  paused: "Em pausa",
  overtime: "Em hora extra",
  off: "Fora do expediente",
};

export type EmployeeActionTone = "entry" | "exit" | "overtime";

export type EmployeeQuickSummary = {
  firstEntry: string | null;
  lastExit: string | null;
  overtime: string;
  status: string;
};

export type EmployeePrimaryAction = {
  helper: string;
  label: string;
  tone: EmployeeActionTone;
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

function getLocalMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function getWeekDayIndex(date: Date, timeZone: string) {
  const shortWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return weekdays.indexOf(shortWeekday);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isAfterConfiguredHours(
  now: Date,
  timeZone: string,
  dailyRules: Record<string, { enabled?: boolean; start?: string; end?: string }> | undefined,
) {
  const dayIndex = getWeekDayIndex(now, timeZone);
  const rule = dailyRules?.[String(dayIndex)] ?? defaultSchedule.weekdays[dayIndex];

  if (!rule?.enabled || !rule.end) {
    return true;
  }

  return getLocalMinutes(now, timeZone) > timeToMinutes(rule.end);
}

function getGreeting(timeZone: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatSimpleTime(timestamp: string | null, timeZone?: string) {
  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(timestamp));
}

function getLocationLabel(status: string | null | undefined) {
  if (status === "outside") return "Fora do geofence";
  if (status === "unknown") return "Geofence indisponível";
  return "Dentro do geofence";
}

async function mapDbEntryToTimeEntry(
  entry: Record<string, unknown>,
  employeeId: string,
  employeeName: string,
): Promise<TimeEntry> {
  const lat = Number(entry.latitude);
  const lng = Number(entry.longitude);
  const accuracy = Number(entry.accuracy_meters);
  const metadata = entry.metadata && typeof entry.metadata === "object" ? (entry.metadata as Record<string, unknown>) : null;
  const locationLabel =
    (await resolveAddressLabel(metadata, lat, lng)) ??
    getLocationLabel((entry.geofence_status as string | null | undefined) ?? "inside");

  return {
    id: String(entry.id),
    employeeId,
    employeeName,
    type: String(entry.event_type) as TimeEntry["type"],
    timestamp: String(entry.recorded_at),
    businessDate: typeof entry.business_date === "string" ? entry.business_date : null,
    pairingGroup: typeof entry.pairing_group === "string" ? entry.pairing_group : null,
    location: {
      lat,
      lng,
      accuracy,
      label: locationLabel,
    },
    isOvertime: Boolean(entry.is_overtime),
    ipAddress: typeof entry.ip_address === "string" ? entry.ip_address : "Não informado",
    deviceLabel: typeof entry.device_label === "string" ? entry.device_label : "Dispositivo não informado",
    selfiePath: typeof entry.selfie_path === "string" ? entry.selfie_path : null,
    selfieUrl: null,
  };
}

async function attachSelfieUrls(entries: TimeEntry[]) {
  return Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      selfieUrl:
        entry.selfiePath && entry.selfiePath !== "admin/manual-adjustment"
          ? await getSignedStorageUrl("time-selfies", entry.selfiePath)
          : null,
    })),
  );
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
  greeting: string;
  primaryAction: EmployeePrimaryAction;
  quickSummary: EmployeeQuickSummary;
  nextEntryType: TimeEntry["type"];
  recentEntries: TimeEntry[];
  role: string;
  summary: {
    normalMinutes: number;
    overtimeMinutes: number;
    totalMinutes: number;
  };
  summaryCards: Array<{ label: string; value: string }>;
  timeZone: string;
  todayEntries: TimeEntry[];
  userId: string;
};

export type EmployeeRequestsSnapshot = {
  requests: EditRequest[];
};

function extractRequestKind(reason: string): EditRequest["kind"] {
  if (reason.startsWith("[Hora extra] ")) {
    return "overtime";
  }

  if (reason.startsWith("[Justificativa] ")) {
    return "justification";
  }

  return "adjust";
}

function stripRequestPrefix(reason: string) {
  return reason
    .replace("[Hora extra] ", "")
    .replace("[Justificativa] ", "")
    .replace("[Ajuste de horário] ", "");
}

export async function getEmployeeTimeSnapshot(supabase: SupabaseClient): Promise<EmployeeTimeSnapshot | null> {
  noStore();

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
      .select("timezone, daily_rules")
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
  const timeZone = (schedule?.timezone as string | undefined) || "America/Manaus";
  const dailyRules =
    schedule?.daily_rules && typeof schedule.daily_rules === "object"
      ? ({
          ...defaultSchedule.weekdays,
          ...(schedule.daily_rules as Record<string, { enabled?: boolean; start?: string; end?: string }>),
        } as Record<string, { enabled?: boolean; start?: string; end?: string }>)
      : (defaultSchedule.weekdays as Record<string, { enabled?: boolean; start?: string; end?: string }>);
  const businessDate = getBusinessDateInTimeZone(timeZone);

  const [todayResult, recentResult] = await Promise.all([
    supabase
      .from("time_entries")
      .select(
        "id, event_type, recorded_at, business_date, pairing_group, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime, selfie_path, metadata",
      )
      .eq("user_id", user.id)
      .eq("business_date", businessDate)
      .order("recorded_at", { ascending: true })
      .limit(50),
    supabase
      .from("time_entries")
      .select(
        "id, event_type, recorded_at, business_date, pairing_group, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime, selfie_path, metadata",
      )
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(240),
  ]);

  const todayEntries = await attachSelfieUrls(
    await Promise.all((todayResult.data ?? []).map((entry) => mapDbEntryToTimeEntry(entry, user.id, employeeName))),
  );
  const recentEntries = await attachSelfieUrls(
    await Promise.all(
      [...(recentResult.data ?? [])]
        .reverse()
        .map((entry) => mapDbEntryToTimeEntry(entry, user.id, employeeName)),
    ),
  );

  const summary = calculateWorkedMinutes(todayEntries);
  const currentState = getCurrentWorkState(todayEntries.at(-1) ?? recentEntries.at(-1) ?? null);
  const nextEntryType = inferNextEntryType((todayEntries.at(-1) ?? recentEntries.at(-1) ?? null)?.type ?? null);
  const afterHours = isAfterConfiguredHours(new Date(), timeZone, dailyRules);
  const firstEntry = todayEntries.find((entry) => entry.type === "entry" || entry.type === "overtime") ?? null;
  const lastExit = [...todayEntries].reverse().find((entry) => entry.type === "exit") ?? null;

  const primaryAction: EmployeePrimaryAction =
    currentState === "overtime"
      ? {
          helper: "Saída de uma jornada extra em andamento.",
          label: "Marcar saída",
          tone: "overtime",
        }
      : nextEntryType === "exit"
        ? {
            helper: "Sua jornada já está aberta. Agora o próximo toque fecha o ciclo.",
            label: "Marcar saída",
            tone: "exit",
          }
        : afterHours
          ? {
              helper: "O horário configurado já terminou. O próximo registro será tratado como hora extra.",
              label: "Registrar hora extra",
              tone: "overtime",
            }
          : {
              helper: "Um toque para abrir a jornada com GPS, selfie e confirmação rápida.",
              label: "Marcar entrada",
              tone: "entry",
            };

  return {
    businessDate,
    currentState,
    employeeName,
    greeting: getGreeting(timeZone),
    primaryAction,
    quickSummary: {
      firstEntry: formatSimpleTime(firstEntry?.timestamp ?? null, timeZone),
      lastExit: formatSimpleTime(lastExit?.timestamp ?? null, timeZone),
      overtime: formatMinutes(summary.overtimeMinutes),
      status: workStateLabels[currentState],
    },
    nextEntryType,
    recentEntries,
    role,
    summary,
    summaryCards: [
      { label: "Horas normais", value: formatMinutes(summary.normalMinutes) },
      { label: "Horas extras", value: formatMinutes(summary.overtimeMinutes) },
      { label: "Total do dia", value: formatMinutes(summary.totalMinutes) },
    ],
    timeZone,
    todayEntries,
    userId: user.id,
  };
}

export async function getEmployeeRequestsSnapshot(
  supabase: SupabaseClient,
): Promise<EmployeeRequestsSnapshot | null> {
  noStore();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("edit_requests")
      .select("id, requested_date, requested_timestamp, requested_event_type, reason, status, created_at, review_notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const employeeName =
    (profile?.full_name as string | undefined) ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined) ||
    user.email ||
    "Usuário";

  return {
    requests: ((rows ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      employeeName,
      requestedAt: String(row.created_at),
      date: String(row.requested_date),
      kind: extractRequestKind(String(row.reason)),
      reason: stripRequestPrefix(String(row.reason)),
      reviewNotes: typeof row.review_notes === "string" ? row.review_notes : null,
      status: String(row.status) as EditRequest["status"],
      requestedEventType: String(row.requested_event_type) as EditRequest["requestedEventType"],
      requestedTime: new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(String(row.requested_timestamp))),
    })),
  };
}
