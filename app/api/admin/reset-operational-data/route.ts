import { NextResponse } from "next/server";
import { recordAdminAudit } from "@/lib/admin-audit";
import { resolveUserRole } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function removeBucketObjects(
  adminClient: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  bucketId: string,
) {
  const { data: rows, error } = await adminClient.schema("storage").from("objects").select("name").eq("bucket_id", bucketId);

  if (error) {
    throw new Error(`Não foi possível listar os arquivos do bucket ${bucketId}.`);
  }

  const paths = (rows ?? [])
    .map((row) => (typeof row.name === "string" ? row.name : null))
    .filter((value): value is string => Boolean(value));

  if (paths.length === 0) {
    return 0;
  }

  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100);
    const { error: removeError } = await adminClient.storage.from(bucketId).remove(chunk);

    if (removeError) {
      throw new Error(`Não foi possível remover arquivos do bucket ${bucketId}.`);
    }
  }

  return paths.length;
}

export async function POST() {
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

  const role = await resolveUserRole(user.id, user.user_metadata?.role, supabase);
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Service role do Supabase não configurada." }, { status: 500 });
  }

  const { data, error } = await adminClient.rpc("reset_operational_data");

  if (error) {
    console.error("reset_operational_data RPC failed", error);

    const message = typeof error.message === "string" ? error.message : "";
    const details = typeof error.details === "string" ? error.details : "";
    const hint = typeof error.hint === "string" ? error.hint : "";
    const combined = `${message} ${details} ${hint}`.toLowerCase();

    if (combined.includes("reset_operational_data") && (combined.includes("not find") || combined.includes("does not exist"))) {
      return NextResponse.json(
        {
          error:
            "A função de reset ainda não existe no Supabase deste ambiente. Aplique a migration 20260601093000_add_reset_operational_data_rpc.sql com `npx supabase db push`.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: message || "Falha ao resetar os dados operacionais.",
      },
      { status: 500 },
    );
  }

  const counts =
    data && typeof data === "object"
      ? (data as Record<string, number>)
      : {
          auditLogs: 0,
          editRequests: 0,
          overtimeEntries: 0,
          storageObjects: 0,
          timeEntries: 0,
        };

  try {
    const [selfiesRemoved, supportRemoved] = await Promise.all([
      removeBucketObjects(adminClient, "time-selfies"),
      removeBucketObjects(adminClient, "edit-support"),
    ]);

    counts.storageObjects = selfiesRemoved + supportRemoved;
  } catch (storageError) {
    return NextResponse.json(
      {
        error:
          storageError instanceof Error
            ? `${storageError.message} O banco já foi resetado, mas a limpeza do Storage não terminou.`
            : "O banco foi resetado, mas houve falha ao limpar o Storage.",
      },
      { status: 500 },
    );
  }

  await recordAdminAudit({
    action: "admin_resetou_dados_operacionais",
    actorUserId: user.id,
    afterData: counts,
    targetTable: "system",
  });

  return NextResponse.json({ counts, ok: true });
}
