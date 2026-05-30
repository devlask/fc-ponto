import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSignedStorageUrl } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  if (!supabase || !adminClient) {
    return NextResponse.json({ error: "Upload de avatar indisponível." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const formData = await request.formData();
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(avatar.type)) {
    return NextResponse.json({ error: "Formato não suportado." }, { status: 400 });
  }

  if (avatar.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "A foto deve ter no máximo 5MB." }, { status: 400 });
  }

  const { data: profile } = await adminClient.from("users").select("avatar_url").eq("id", user.id).maybeSingle();

  const timestamp = Date.now();
  const extension = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
  const avatarPath = `${user.id}/avatar-${timestamp}.${extension}`;
  const buffer = await avatar.arrayBuffer();

  const { error: uploadError } = await adminClient.storage.from("profile-avatars").upload(avatarPath, buffer, {
    cacheControl: "3600",
    contentType: avatar.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: "Não foi possível enviar a foto." }, { status: 400 });
  }

  const { error: updateError } = await adminClient
    .from("users")
    .update({
      avatar_url: avatarPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    await adminClient.storage.from("profile-avatars").remove([avatarPath]);
    return NextResponse.json({ error: "Falha ao salvar a foto de perfil." }, { status: 400 });
  }

  const previousAvatar = typeof profile?.avatar_url === "string" ? profile.avatar_url : null;
  if (previousAvatar && previousAvatar !== avatarPath) {
    await adminClient.storage.from("profile-avatars").remove([previousAvatar]);
  }

  const avatarUrl = await getSignedStorageUrl("profile-avatars", avatarPath);

  return NextResponse.json({ avatarPath, avatarUrl, ok: true });
}
