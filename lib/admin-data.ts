import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
      .limit(40),
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
    lastEvent: typeof row.last_event_type === "string" ? row.last_event_type : "Sem registro",
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

export async function getAdminTeamData() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { members: [] as AdminTeamMember[] };
  }

  const [usersResult, activeWorkersResult] = await Promise.all([
    supabase.from("users").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }),
    supabase.from("vw_active_workers").select("user_id, current_state"),
  ]);

  const stateMap = new Map(
    ((activeWorkersResult.data ?? []) as SupabaseRow[]).map((worker) => [
      String(worker.user_id),
      mapWorkState((worker.current_state as string | null | undefined) ?? "off"),
    ]),
  );

  return {
    members: ((usersResult.data ?? []) as SupabaseRow[]).map((user) => ({
      createdAt: String(user.created_at),
      email: String(user.email),
      fullName: String(user.full_name),
      id: String(user.id),
      role: String(user.role) as UserRole,
      status: stateMap.get(String(user.id)) ?? "off",
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
        reason: String(row.reason),
      } satisfies AdminEditRequest;
    }),
  };
}
