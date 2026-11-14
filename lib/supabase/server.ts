import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/env";

// Sign-up must not write auth cookies. A session is returned only for a new
// email when email confirmation is off, so storing it would distinguish that
// email from one that is already registered.
const signUpAuthOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

const createSignUpClient = () => {
  const { url, key } = getSupabaseEnv();

  return createSupabaseClient(url, key, {
    auth: signUpAuthOptions,
  });
};

const createClient = async () => {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session.
        }
      },
    },
  });
};

export { createClient, createSignUpClient, signUpAuthOptions };
