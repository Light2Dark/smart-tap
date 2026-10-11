import type { SupabaseClient } from "@supabase/supabase-js";

export async function signCardImage(
  supabase: SupabaseClient,
  path: string | null,
) {
  if (!path) {
    return null;
  }
  const { data, error } = await supabase.storage
    .from("cards")
    .createSignedUrl(path, 60 * 60);
  if (error) {
    return null;
  }
  return data.signedUrl;
}
