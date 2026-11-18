import { type NextRequest, NextResponse } from "next/server";

import {
  isSameOrigin,
  readImplicitSessionBody,
} from "@/lib/auth/implicit-grant";
import { createClient } from "@/lib/supabase/server";

const json = (ok: boolean, status: number) => {
  return NextResponse.json({ ok }, { status });
};

const POST = async (request: NextRequest) => {
  if (!isSameOrigin(request.headers.get("origin"), request.nextUrl.origin)) {
    return json(false, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(false, 400);
  }

  let body: unknown;

  try {
    const text = await request.text();

    if (text.length > 20_000) {
      return json(false, 400);
    }

    body = JSON.parse(text);
  } catch {
    return json(false, 400);
  }

  const session = readImplicitSessionBody(body);

  if (!session) {
    return json(false, 400);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    if (error) {
      return json(false, 400);
    }
  } catch {
    return json(false, 400);
  }

  return json(true, 200);
};

export { POST };
