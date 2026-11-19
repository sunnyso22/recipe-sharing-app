import assert from "node:assert/strict";

import { describe, test } from "bun:test";
import { NextRequest, NextResponse } from "next/server";

import type { LiveAccount } from "@/lib/auth/live-session";
import {
  applyProxySession,
  guestAuthRedirect,
  resolveProxySession,
} from "@/lib/supabase/proxy";

const userId = "3f1a9c2e-7b44-4d1a-9c3e-6a8b0d2e4f17";
const sessionId = "8c0e1a22-6b5d-4f0a-9d3c-1e7b4a9c2d55";
const email = "cook@example.com";

const claims = {
  sub: userId,
  email,
  session_id: sessionId,
  user_metadata: { name: "Not Used For Auth" },
};

const live: LiveAccount = {
  accountExists: true,
  sessionExists: true,
};

const depsFor = (account: LiveAccount) => {
  const calls: string[] = [];

  return {
    calls,
    deps: {
      liveAccount: async (ids: { userId: string; sessionId: string }) => {
        calls.push(`lookup:${ids.userId}:${ids.sessionId}`);
        return account;
      },
      clearLocalSession: async () => {
        calls.push("clear");
      },
    },
  };
};

const gate = async (
  path: string,
  session: Awaited<ReturnType<typeof resolveProxySession>>,
) => {
  const request = new NextRequest(`http://localhost${path}`);
  const next = NextResponse.next();
  next.cookies.set("sb-refresh-token", "rotated", { path: "/" });
  const response = applyProxySession(request, next, session);
  const location = response.headers.get("location");

  return {
    next,
    response,
    location,
    pathname: location ? new URL(location).pathname : null,
    search: location ? new URL(location).search : null,
    refresh: response.cookies.get("sb-refresh-token")?.value,
  };
};

describe("signed-in login and signup", () => {
  test("sends a live session home from login and signup", async () => {
    const recorded = depsFor(live);
    const session = await resolveProxySession(claims, null, recorded.deps);

    assert.equal(session.decision.status, "active");

    if (session.decision.status === "active") {
      assert.equal(session.decision.user.id, userId);
      assert.equal(session.decision.user.name, "Not Used For Auth");
    }

    assert.deepEqual(recorded.calls, [`lookup:${userId}:${sessionId}`]);

    const login = await gate("/login", session);
    const signup = await gate("/signup/", session);

    assert.equal(login.pathname, "/");
    assert.equal(login.search, "");
    assert.equal(login.response.status, 307);
    assert.equal(login.refresh, "rotated");
    assert.equal(signup.pathname, "/");
    assert.equal(signup.search, "");
    assert.equal(guestAuthRedirect("/login", session.decision), "/");
    assert.equal(guestAuthRedirect("/signup", session.decision), "/");
  });

  test("drops the login query when a live session is sent home", async () => {
    const session = await resolveProxySession(claims, null, depsFor(live).deps);
    const confirmed = await gate("/login?confirmed=1", session);
    const next = await gate("/login?next=/cookbook", session);

    assert.equal(confirmed.pathname, "/");
    assert.equal(confirmed.search, "");
    assert.equal(next.pathname, "/");
    assert.equal(next.search, "");
  });

  test("leaves signup confirmation on login while signed out", async () => {
    const recorded = depsFor(live);
    const session = await resolveProxySession(null, null, recorded.deps);
    const response = await gate("/login?confirmed=1", session);

    assert.equal(session.decision.status, "anonymous");
    assert.equal(recorded.calls.length, 0);
    assert.equal(response.response, response.next);
    assert.equal(response.location, null);
    assert.equal(guestAuthRedirect("/login", session.decision), null);
  });

  test("lets a signed-out visitor open login and signup", async () => {
    const session = await resolveProxySession(undefined, null, depsFor(live).deps);
    const login = await gate("/login", session);
    const signup = await gate("/signup", session);

    assert.equal(login.response, login.next);
    assert.equal(signup.response, signup.next);
    assert.equal(login.location, null);
    assert.equal(signup.location, null);
  });

  test("does not treat a deleted account's leftover jwt as signed in", async () => {
    const recorded = depsFor({
      accountExists: false,
      sessionExists: false,
    });
    const session = await resolveProxySession(claims, null, recorded.deps);
    const login = await gate("/login", session);
    const signup = await gate("/signup", session);
    const cookbook = await gate("/cookbook", session);

    assert.equal(session.decision.status, "revoked");
    assert.equal(session.claims, undefined);
    assert.deepEqual(recorded.calls, [`lookup:${userId}:${sessionId}`, "clear"]);
    assert.equal(login.location, null);
    assert.equal(signup.location, null);
    assert.equal(cookbook.pathname, "/login");
    assert.equal(cookbook.search, "");
    assert.equal(cookbook.refresh, "rotated");
  });

  test("does not treat a missing session row as signed in", async () => {
    const recorded = depsFor({
      accountExists: true,
      sessionExists: false,
    });
    const session = await resolveProxySession(claims, null, recorded.deps);
    const signup = await gate("/signup", session);

    assert.equal(session.decision.status, "revoked");
    assert.equal(signup.location, null);
    assert.deepEqual(recorded.calls, [`lookup:${userId}:${sessionId}`, "clear"]);
  });

  test("does not treat a jwt that cannot name a session as signed in", async () => {
    const recorded = depsFor(live);
    const session = await resolveProxySession(
      {
        sub: userId,
        email,
        session_id: "not-a-session",
        user_metadata: { name: userId },
      },
      null,
      recorded.deps,
    );
    const login = await gate("/login", session);

    assert.equal(session.decision.status, "revoked");
    assert.equal(login.location, null);
    assert.deepEqual(recorded.calls, ["clear"]);
  });

  test("does not treat an auth user_not_found error as signed in", async () => {
    const recorded = depsFor(live);
    const session = await resolveProxySession(
      claims,
      { code: "user_not_found" },
      recorded.deps,
    );
    const login = await gate("/login", session);

    assert.equal(session.decision.status, "anonymous");
    assert.equal(session.claims, undefined);
    assert.equal(login.location, null);
    assert.deepEqual(recorded.calls, ["clear"]);
  });

  test("does not treat a session_not_found error as signed in", async () => {
    const recorded = depsFor(live);
    const session = await resolveProxySession(
      claims,
      { code: "session_not_found" },
      recorded.deps,
    );

    assert.equal((await gate("/signup", session)).location, null);
    assert.deepEqual(recorded.calls, ["clear"]);
  });

  test("does not redirect a live session that has no email claim", async () => {
    const session = await resolveProxySession(
      { sub: userId, session_id: sessionId },
      null,
      depsFor(live).deps,
    );

    assert.equal(session.decision.status, "anonymous");
    assert.equal((await gate("/login", session)).location, null);
    assert.equal((await gate("/cookbook", session)).location, null);
  });

  test("leaves forgot-password and reset-password unchanged", async () => {
    const session = await resolveProxySession(claims, null, depsFor(live).deps);
    const forgot = await gate("/forgot-password?error=expired", session);
    const reset = await gate("/reset-password", session);

    assert.equal(session.decision.status, "active");
    assert.equal(forgot.response, forgot.next);
    assert.equal(reset.response, reset.next);
    assert.equal(guestAuthRedirect("/forgot-password", session.decision), null);
    assert.equal(guestAuthRedirect("/reset-password", session.decision), null);
  });

  test("does not redirect other paths that only share a prefix", async () => {
    const session = await resolveProxySession(claims, null, depsFor(live).deps);

    assert.equal((await gate("/login/help", session)).location, null);
    assert.equal((await gate("/signup/extra", session)).location, null);
    assert.equal((await gate("/", session)).location, null);
  });

  test("still sends a signed-out visitor from a protected page to login", async () => {
    const session = await resolveProxySession(null, null, depsFor(live).deps);
    const cookbook = await gate("/cookbook", session);
    const editor = await gate("/recipes/abc/edit", session);
    const home = await gate("/", session);

    assert.equal(cookbook.pathname, "/login");
    assert.equal(cookbook.refresh, "rotated");
    assert.equal(editor.pathname, "/login");
    assert.equal(home.location, null);
  });

  test("lets a live session open a protected page", async () => {
    const session = await resolveProxySession(claims, null, depsFor(live).deps);
    const cookbook = await gate("/cookbook", session);
    const editor = await gate("/recipes/abc/edit/", session);

    assert.equal(cookbook.response, cookbook.next);
    assert.equal(editor.response, editor.next);
  });
});
