"use client";

import { useSession } from "@clerk/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { supabaseEnv } from "@/utils/supabase/env";

export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    const { url, key } = supabaseEnv();

    return createSupabaseClient(url, key, {
      accessToken: async () => (await session?.getToken()) ?? null,
    });
  }, [session]);
}
