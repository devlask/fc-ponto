import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminAuditPayload = {
  action: string;
  actorUserId: string;
  afterData?: Record<string, unknown> | null;
  beforeData?: Record<string, unknown> | null;
  targetId?: string | null;
  targetTable: string;
};

export async function recordAdminAudit({
  action,
  actorUserId,
  afterData = null,
  beforeData = null,
  targetId = null,
  targetTable,
}: AdminAuditPayload) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.from("audit_logs").insert({
    action,
    actor_user_id: actorUserId,
    after_data: afterData,
    before_data: beforeData,
    target_id: targetId,
    target_table: targetTable,
  });
}
