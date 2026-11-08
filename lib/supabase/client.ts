import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

const createClient = () => {
  const { url, key } = getSupabaseEnv();

  return createBrowserClient(url, key);
};

export { createClient };
