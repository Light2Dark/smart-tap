import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/utils/supabase/env";

export function createClient() {
  const { url, key } = supabaseEnv();

  return createSupabaseClient(url, key, {
    accessToken: async () => (await auth()).getToken(),
  });
}
