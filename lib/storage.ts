import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getSignedStorageUrl(bucket: string, path: string | null | undefined, expiresIn = 60 * 60) {
  if (!path) {
    return null;
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return null;
  }

  const { data, error } = await adminClient.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    return null;
  }

  return data.signedUrl;
}
