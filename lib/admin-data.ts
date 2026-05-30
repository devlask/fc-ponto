import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateWorkedMinutes } from "@/lib/time";
import { formatMinutes } from "@/lib/utils";
import type { ActiveWorker, ApprovalStatus, EntryType, TimeEntry, UserRole } from "@/types";

export type AdminSession = {
  role: UserRole;
  userId: string;
};

export type AdminTeamMember = {
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  lastEvent: string;
  role: UserRole;
  status: ActiveWorker["status"];
};

export type AdminEditRequest = {
  createdAt: string;
  id: string;
  requestedDate: string;
  requestedEventType: EntryType;
  requestedTime: string;
  requesterEmail: string;
  requesterName: string;
  reviewNotes: string | null;
  status: ApprovalStatus;
  reason: string;
};

export type AdminAuditLog = {
  action: string;
  actorName: string;
  createdAt: string;
  id: string;
  targetId: string | null;
  targetTable: string;
};

export type AdminTimeEntryRow = TimeEntry & {
  role: UserRole;
};

export type AdminDashboardCard = {
  label: string;
  tone: "cyan" | "magenta" | "yellow" | "blue";
  value: string;
};

export type AdminDashboardSnapshot = {
  activeWorkers: ActiveWorker[];
  cards: AdminDashboardCard[];
  generatedAt: string;
  greeting: string;
  pendingRequests: AdminEditRequest[];
  quickSummary: Array<{ label: string; value: string }>;
};

export type AdminEmployeeDetail = {
  entries: AdminTimeEntryRow[];
  id: string;
  email: string;
  fullName: string;
  periodDays: number | null;
  role: UserRole;
  summaryCards: Array<{ label: string; value: string }>;
};

type SupabaseRow = Record<string, unknown>;
const validRoles = new Set<UserRole>(["employee", "manager", "admin"]);

function normalizeRole(value: unknown): UserRole | null {
  return typeof value === "string" && validRoles.has(value as UserRole) ? (value as UserRole) : null;
}

export async function resolveUserRole(
  userId: string,
  fallbackRole?: unknown,
  providedSupabase?: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<UserRole> {
  const supabase = providedSupabase ?? (await createSupabaseServerClient());

  if (supabase) {
    const { data: profile, error } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
    const directRole = normalizeRole(profile?.role);

    if (directRole) {
      return directRole;
    }

    if (error) {
      console.error("Failed to resolve role from public.users", error);
    }
  }

  const adminClient = createSupabaseAdminClient();
  if (adminClient) {
    const { data: adminProfile, error: adminError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const adminRole = normalizeRole(adminProfile?.role);
    if (adminRole) {
      return adminRole;
    }

    if (adminError) {
      console.error("Failed to resolve role with service role", adminError);
    }
  }

  return normalizeRole(fallbackRole) ?? "employee";
}

function mapWorkState(value: string | null | undefined): ActiveWorker["status"] {
  if (value === "paused") return "paused";
  if (value === "overtime") return "overtime";
  if (value === "working") return "working";
  return "off";
}

function mapLocationLabel(status: string | null | undefined) {
  if (status === "outside") return "Fora do geofence";
  if (status === "unknown") return "Geofence indisponível";
  return "Dentro do geofence";
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTimeOnly(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getGreetingForNow(timeZone: string) {
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

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getMinutesInTimeZone(date: Date, timeZone: string) {
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

function getDayIndexInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return weekdays.indexOf(parts);
}

function formatActiveWorkerEvent(
  eventType: string | null | undefined,
  recordedAt: string | null | undefined,
  status: ActiveWorker["status"],
) {
  if (!eventType || !recordedAt) {
    return "Sem marcação recente";
  }

  const time = formatTimeOnly(recordedAt);

  if (status === "overtime") {
    return `Hora extra desde ${time}`;
  }

  if (eventType === "exit") {
    return `Saiu ${time}`;
  }

  if (eventType === "return") {
    return `Retornou ${time}`;
  }

  if (eventType === "pause") {
    return `Pausou ${time}`;
  }

  return `Entrou ${time}`;
}

function calculateLateMetrics(
  entries: AdminTimeEntryRow[],
  dailyRules: Record<string, { enabled?: boolean; start?: string }>,
  toleranceMinutes: number,
  timeZone: string,
) {
  const firstEntriesByDay = new Map<string, AdminTimeEntryRow>();

  for (const entry of entries) {
    if (entry.type !== "entry") {
      continue;
    }

    const date = new Date(entry.timestamp);
    const dayKey = getDateKeyInTimeZone(date, timeZone);
    const current = firstEntriesByDay.get(dayKey);

    if (!current || new Date(current.timestamp).getTime() > date.getTime()) {
      firstEntriesByDay.set(dayKey, entry);
    }
  }

  let lateDays = 0;
  let lateMinutes = 0;

  for (const entry of firstEntriesByDay.values()) {
    const date = new Date(entry.timestamp);
    const dayIndex = getDayIndexInTimeZone(date, timeZone);
    const rule = dailyRules[String(dayIndex)];

    if (!rule?.enabled || !rule.start) {
      continue;
    }

    const startMinutes = timeToMinutes(rule.start) + toleranceMinutes;
    const entryMinutes = getMinutesInTimeZone(date, timeZone);
    const delay = entryMinutes - startMinutes;

    if (delay > 0) {
      lateDays += 1;
      lateMinutes += delay;
    }
  }

  return { lateDays, lateMinutes };
}

function mapTimeEntry(row: SupabaseRow, userName: string, userRole: UserRole, userId: string): AdminTimeEntryRow {
  return {
    id: String(row.id),
    employeeId: userId,
    employeeName: userName,
    type: String(row.event_type) as EntryType,
    timestamp: String(row.recorded_at),
    location: {
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      accuracy: Number(row.accuracy_meters),
      label: mapLocationLabel((row.geofence_status as string | null | undefined) ?? "inside"),
    },
    isOvertime: Boolean(row.is_overtime),
    ipAddress: typeof row.ip_address === "string" ? row.ip_address : "Não informado",
    deviceLabel: typeof row.device_label === "string" ? row.device_label : "Dispositivo não informado",
    role: userRole,
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const role = await resolveUserRole(user.id, user.user_metadata?.role, supabase);

  if (role !== "manager" && role !== "admin") {
    redirect("/employee");
  }

  return { role, userId: user.id };
}

export async function getShellRole() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return "employee" as UserRole;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "employee" as UserRole;
  }

  return resolveUserRole(user.id, user.user_metadata?.role, supabase);
}

export async function getAdminSnapshot() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [usersResult, pendingRequestsResult, activeWorkersResult, timeEntriesResult, auditLogsResult] = await Promise.all([
    supabase.from("users").select("id, full_name, email, role, created_at, is_active").order("created_at", { ascending: false }),
    supabase.from("edit_requests").select("id").eq("status", "pending"),
    supabase.from("vw_active_workers").select("*"),
    supabase
      .from("time_entries")
      .select("id, user_id, event_type, recorded_at, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime")
      .order("recorded_at", { ascending: false })
      .limit(120),
    supabase.from("audit_logs").select("id, action, target_table, target_id, actor_user_id, created_at").order("created_at", { ascending: false }).limit(30),
  ]);

  const users = (usersResult.data ?? []) as SupabaseRow[];
  const userMap = new Map(
    users.map((user) => [
      String(user.id),
      {
        email: String(user.email),
        fullName: String(user.full_name),
        role: String(user.role) as UserRole,
      },
    ]),
  );

  const activeWorkers = ((activeWorkersResult.data ?? []) as SupabaseRow[]).map((row) => ({
    id: String(row.user_id),
    name: String(row.full_name),
    team: String(row.role).toUpperCase(),
    status: mapWorkState((row.current_state as string | null | undefined) ?? "off"),
    lastEvent: formatActiveWorkerEvent(
      typeof row.last_event_type === "string" ? row.last_event_type : null,
      typeof row.last_recorded_at === "string" ? row.last_recorded_at : null,
      mapWorkState((row.current_state as string | null | undefined) ?? "off"),
    ),
    location: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0),
      accuracy: Number(row.accuracy_meters ?? 0),
      label: "Localização ao vivo",
    },
  })) satisfies ActiveWorker[];

  const history = ((timeEntriesResult.data ?? []) as SupabaseRow[]).map((row) => {
    const userProfile = userMap.get(String(row.user_id));

    return mapTimeEntry(
      row,
      userProfile?.fullName ?? "Usuário",
      userProfile?.role ?? "employee",
      String(row.user_id),
    );
  });

  const auditLogs = ((auditLogsResult.data ?? []) as SupabaseRow[]).map((row) => {
    const actor = userMap.get(String(row.actor_user_id ?? ""));

    return {
      action: String(row.action),
      actorName: actor?.fullName ?? "Sistema",
      createdAt: String(row.created_at),
      id: String(row.id),
      targetId: row.target_id ? String(row.target_id) : null,
      targetTable: String(row.target_table),
    } satisfies AdminAuditLog;
  });

  const cards = [
    { label: "Funcionários", value: String(users.length) },
    { label: "Ativos agora", value: String(activeWorkers.filter((worker) => worker.status !== "off").length) },
    { label: "Pendências", value: String((pendingRequestsResult.data ?? []).length) },
    { label: "Logs recentes", value: String(auditLogs.length) },
  ];

  return {
    activeWorkers,
    auditLogs,
    cards,
    history,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardSnapshot | null> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [usersResult, scheduleResult, activeWorkersResult, pendingRequestsResult, pendingCountResult] = await Promise.all([
    supabase.from("users").select("id, full_name, role, is_active").eq("is_active", true),
    supabase
      .from("work_schedule_settings")
      .select("timezone, tolerance_minutes, daily_rules")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .maybeSingle(),
    supabase.from("vw_active_workers").select("*"),
    supabase
      .from("edit_requests")
      .select("id, user_id, requested_date, requested_event_type, requested_timestamp, reason, status, created_at, review_notes")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("edit_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const timeZone = typeof scheduleResult.data?.timezone === "string" ? scheduleResult.data.timezone : "America/Sao_Paulo";
  const toleranceMinutes = typeof scheduleResult.data?.tolerance_minutes === "number" ? scheduleResult.data.tolerance_minutes : 10;
  const dailyRules =
    scheduleResult.data?.daily_rules && typeof scheduleResult.data.daily_rules === "object"
      ? (scheduleResult.data.daily_rules as Record<string, { enabled?: boolean; start?: string }>)
      : {};
  const businessDate = getDateKeyInTimeZone(new Date(), timeZone);

  const users = ((usersResult.data ?? []) as SupabaseRow[]).filter((user) => {
    const role = String(user.role) as UserRole;
    return role === "employee" || role === "manager";
  });
  const userIds = users.map((user) => String(user.id));

  const [todayEntriesResult, requestUsersResult] = await Promise.all([
    supabase
      .from("time_entries")
      .select("user_id, event_type, recorded_at, business_date")
      .eq("business_date", businessDate)
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])
      .order("recorded_at", { ascending: true }),
    supabase
      .from("users")
      .select("id, full_name, email")
      .in(
        "id",
        [...new Set(((pendingRequestsResult.data ?? []) as SupabaseRow[]).map((row) => String(row.user_id)))].length > 0
          ? [...new Set(((pendingRequestsResult.data ?? []) as SupabaseRow[]).map((row) => String(row.user_id)))]
          : ["00000000-0000-0000-0000-000000000000"],
      ),
  ]);

  const activeWorkers = ((activeWorkersResult.data ?? []) as SupabaseRow[])
    .map((row) => {
      const status = mapWorkState((row.current_state as string | null | undefined) ?? "off");

      return {
        id: String(row.user_id),
        name: String(row.full_name),
        team: String(row.role).toUpperCase(),
        status,
        lastEvent: formatActiveWorkerEvent(
          typeof row.last_event_type === "string" ? row.last_event_type : null,
          typeof row.last_recorded_at === "string" ? row.last_recorded_at : null,
          status,
        ),
        location: {
          lat: Number(row.latitude ?? 0),
          lng: Number(row.longitude ?? 0),
          accuracy: Number(row.accuracy_meters ?? 0),
          label: "Localização ao vivo",
        },
      } satisfies ActiveWorker;
    })
    .filter((worker) => worker.status !== "off");

  const firstEntriesByUser = new Map<string, string>();
  for (const row of (todayEntriesResult.data ?? []) as SupabaseRow[]) {
    if (String(row.event_type) !== "entry") {
      continue;
    }

    const userId = String(row.user_id);
    if (!firstEntriesByUser.has(userId)) {
      firstEntriesByUser.set(userId, String(row.recorded_at));
    }
  }

  let lateCount = 0;
  const currentRule = dailyRules[String(getDayIndexInTimeZone(new Date(), timeZone))];
  const threshold = currentRule?.enabled && currentRule.start ? timeToMinutes(currentRule.start) + toleranceMinutes : null;

  if (threshold !== null && getMinutesInTimeZone(new Date(), timeZone) > threshold) {
    for (const user of users) {
      const firstEntry = firstEntriesByUser.get(String(user.id));
      if (!firstEntry) {
        lateCount += 1;
        continue;
      }

      if (getMinutesInTimeZone(new Date(firstEntry), timeZone) > threshold) {
        lateCount += 1;
      }
    }
  }

  const requestUsers = new Map(
    ((requestUsersResult.data ?? []) as SupabaseRow[]).map((row) => [
      String(row.id),
      { email: String(row.email), fullName: String(row.full_name) },
    ]),
  );

  const pendingRequests = ((pendingRequestsResult.data ?? []) as SupabaseRow[]).map((row) => {
    const requester = requestUsers.get(String(row.user_id));

    return {
      createdAt: String(row.created_at),
      id: String(row.id),
      requestedDate: String(row.requested_date),
      requestedEventType: String(row.requested_event_type) as EntryType,
      requestedTime: formatTimeOnly(String(row.requested_timestamp)),
      requesterEmail: requester?.email ?? "Sem email",
      requesterName: requester?.fullName ?? "Usuário",
      reviewNotes: typeof row.review_notes === "string" ? row.review_notes : null,
      status: String(row.status) as ApprovalStatus,
      reason: String(row.reason)
        .replace("[Hora extra] ", "")
        .replace("[Justificativa] ", "")
        .replace("[Ajuste de horário] ", ""),
    } satisfies AdminEditRequest;
  });

  const latestEntry = ((todayEntriesResult.data ?? []) as SupabaseRow[]).at(-1);

  const latestEntryLabel =
    latestEntry && String(latestEntry.event_type) === "exit"
      ? "Saída"
      : latestEntry
        ? "Entrada"
        : "Sem registro hoje";

  return {
    activeWorkers,
    cards: [
      { label: "Trabalhando", tone: "cyan", value: String(activeWorkers.filter((worker) => worker.status === "working").length) },
      { label: "Hora extra", tone: "yellow", value: String(activeWorkers.filter((worker) => worker.status === "overtime").length) },
      { label: "Atrasados", tone: "magenta", value: String(lateCount) },
      { label: "Solicitações", tone: "blue", value: String(pendingCountResult.count ?? pendingRequests.length) },
    ],
    generatedAt: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone,
    }).format(new Date()),
    greeting: getGreetingForNow(timeZone),
    pendingRequests,
    quickSummary: [
      { label: "Equipe ativa", value: `${activeWorkers.length} pessoa(s)` },
      { label: "Marcações do dia", value: String((todayEntriesResult.data ?? []).length) },
      {
        label: "Último registro",
        value: latestEntry ? `${latestEntryLabel} • ${formatTimeOnly(String(latestEntry.recorded_at))}` : "Sem registro hoje",
      },
    ],
  };
}

export async function getAdminTeamData() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { members: [] as AdminTeamMember[] };
  }

  const [usersResult, activeWorkersResult] = await Promise.all([
    supabase.from("users").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }),
    supabase.from("vw_active_workers").select("user_id, current_state, last_event_type, last_recorded_at"),
  ]);

  const stateMap = new Map(
    ((activeWorkersResult.data ?? []) as SupabaseRow[]).map((worker) => [
      String(worker.user_id),
      {
        lastEvent: formatActiveWorkerEvent(
          typeof worker.last_event_type === "string" ? worker.last_event_type : null,
          typeof worker.last_recorded_at === "string" ? worker.last_recorded_at : null,
          mapWorkState((worker.current_state as string | null | undefined) ?? "off"),
        ),
        status: mapWorkState((worker.current_state as string | null | undefined) ?? "off"),
      },
    ]),
  );

  return {
    members: ((usersResult.data ?? []) as SupabaseRow[]).map((user) => ({
      createdAt: String(user.created_at),
      email: String(user.email),
      fullName: String(user.full_name),
      id: String(user.id),
      lastEvent: stateMap.get(String(user.id))?.lastEvent ?? "Sem marcação recente",
      role: String(user.role) as UserRole,
      status: stateMap.get(String(user.id))?.status ?? "off",
    })),
  };
}

export async function getAdminApprovalsData() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { requests: [] as AdminEditRequest[] };
  }

  const requestsResult = await supabase
    .from("edit_requests")
    .select("id, user_id, requested_date, requested_event_type, requested_timestamp, reason, status, created_at, review_notes")
    .order("created_at", { ascending: false });

  const rows = (requestsResult.data ?? []) as SupabaseRow[];
  const userIds = [...new Set(rows.map((row) => String(row.user_id)))];
  const usersResult = await supabase.from("users").select("id, full_name, email").in("id", userIds);
  const users = new Map(
    ((usersResult.data ?? []) as SupabaseRow[]).map((user) => [
      String(user.id),
      { email: String(user.email), fullName: String(user.full_name) },
    ]),
  );

  return {
    requests: rows.map((row) => {
      const requester = users.get(String(row.user_id));
      return {
        createdAt: String(row.created_at),
        id: String(row.id),
        requestedDate: String(row.requested_date),
        requestedEventType: String(row.requested_event_type) as EntryType,
        requestedTime: new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(String(row.requested_timestamp))),
        requesterEmail: requester?.email ?? "Sem email",
        requesterName: requester?.fullName ?? "Usuário",
        reviewNotes: typeof row.review_notes === "string" ? row.review_notes : null,
        status: String(row.status) as ApprovalStatus,
        reason: String(row.reason)
          .replace("[Hora extra] ", "")
          .replace("[Justificativa] ", "")
          .replace("[Ajuste de horário] ", ""),
      } satisfies AdminEditRequest;
    }),
  };
}

export async function getAdminEmployeeDetail(userId: string, periodDays: number | null = 30): Promise<AdminEmployeeDetail | null> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [{ data: userProfile }, { data: schedule }, { data: entriesResult }] = await Promise.all([
    supabase.from("users").select("id, full_name, email, role").eq("id", userId).maybeSingle(),
    supabase
      .from("work_schedule_settings")
      .select("timezone, tolerance_minutes, daily_rules")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .maybeSingle(),
    supabase
      .from("time_entries")
      .select(
        "id, user_id, event_type, recorded_at, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime",
      )
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(180),
  ]);

  if (!userProfile) {
    return null;
  }

  const entries = [...(entriesResult ?? [])]
    .reverse()
    .map((row) => mapTimeEntry(row, String(userProfile.full_name), String(userProfile.role) as UserRole, userId));
  const filteredEntries =
    periodDays === null
      ? entries
      : entries.filter(
          (entry) => new Date(entry.timestamp).getTime() >= Date.now() - periodDays * 24 * 60 * 60 * 1000,
        );
  const summary = calculateWorkedMinutes(filteredEntries);
  const timeZone = typeof schedule?.timezone === "string" ? schedule.timezone : "America/Sao_Paulo";
  const toleranceMinutes = typeof schedule?.tolerance_minutes === "number" ? schedule.tolerance_minutes : 10;
  const dailyRules =
    schedule?.daily_rules && typeof schedule.daily_rules === "object"
      ? (schedule.daily_rules as Record<string, { enabled?: boolean; start?: string }>)
      : {};
  const lateMetrics = calculateLateMetrics(filteredEntries, dailyRules, toleranceMinutes, timeZone);

  return {
    email: String(userProfile.email),
    entries: filteredEntries,
    fullName: String(userProfile.full_name),
    id: String(userProfile.id),
    periodDays,
    role: String(userProfile.role) as UserRole,
    summaryCards: [
      { label: "Horas trabalhadas", value: formatMinutes(summary.totalMinutes) },
      { label: "Horas extras", value: formatMinutes(summary.overtimeMinutes) },
      { label: "Atrasos", value: `${lateMetrics.lateDays} dia(s) • ${lateMetrics.lateMinutes} min` },
      { label: "Registros", value: String(filteredEntries.length) },
    ],
  };
}
