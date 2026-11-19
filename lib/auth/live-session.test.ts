import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import {
  clearSessionIfAuthEnded,
  decideAuthSession,
  type LiveAccount,
  settleAuthSession,
} from "@/lib/auth/live-session";

const userId = "3f1a9c2e-7b44-4d1a-9c3e-6a8b0d2e4f17";
const sessionId = "8c0e1a22-6b5d-4f0a-9d3c-1e7b4a9c2d55";
const email = "cook@example.com";

const claims = {
  sub: userId,
  email,
  session_id: sessionId,
  user_metadata: { name: "Ada Lovelace" },
};

const live: LiveAccount = {
  accountExists: true,
  sessionExists: true,
};

const events = () => {
  const calls: string[] = [];

  return {
    calls,
    deps: {
      liveAccount: async (ids: { userId: string; sessionId: string }) => {
        calls.push(`lookup:${ids.userId}:${ids.sessionId}`);
        return live;
      },
      clearLocalSession: async () => {
        calls.push("clear");
      },
    },
  };
};

describe("live auth session", () => {
  test("treats a verified jwt as signed in only while the account and session exist", () => {
    const decision = decideAuthSession(claims, live);

    assert.deepEqual(decision, {
      status: "active",
      user: {
        id: userId,
        email,
        name: "Ada Lovelace",
      },
    });
  });

  test("authorizes the auth user id, not the display name", () => {
    const decision = decideAuthSession(
      {
        ...claims,
        user_metadata: { name: "Someone Else" },
      },
      live,
    );

    assert.equal(decision.status, "active");

    if (decision.status === "active") {
      assert.equal(decision.user.id, userId);
      assert.equal(decision.user.name, "Someone Else");
    }
  });

  test("rejects a still-valid jwt when the account has been deleted", () => {
    assert.deepEqual(
      decideAuthSession(claims, {
        accountExists: false,
        sessionExists: true,
      }),
      { status: "revoked" },
    );
  });

  test("rejects a still-valid jwt when its session row is gone", () => {
    assert.deepEqual(
      decideAuthSession(claims, {
        accountExists: true,
        sessionExists: false,
      }),
      { status: "revoked" },
    );
  });

  test("rejects a jwt that does not name a session", () => {
    assert.deepEqual(
      decideAuthSession(
        {
          sub: userId,
          email,
          user_metadata: { name: "Ada Lovelace" },
        },
        live,
      ),
      { status: "revoked" },
    );
  });

  test("does not treat a live session without an email as revoked", () => {
    assert.deepEqual(
      decideAuthSession(
        {
          sub: userId,
          session_id: sessionId,
        },
        live,
      ),
      { status: "anonymous" },
    );
  });

  test("ignores claims that do not name a user", () => {
    assert.deepEqual(decideAuthSession(null, null), { status: "anonymous" });
    assert.deepEqual(
      decideAuthSession({ email, session_id: sessionId }, live),
      { status: "anonymous" },
    );
  });

  test("keeps the session when the account and session are still there", async () => {
    const recorded = events();
    const decision = await settleAuthSession(claims, recorded.deps);

    assert.deepEqual(decision, {
      status: "active",
      user: {
        id: userId,
        email,
        name: "Ada Lovelace",
      },
    });
    assert.deepEqual(recorded.calls, [`lookup:${userId}:${sessionId}`]);
  });

  test("clears the local session when the account is gone", async () => {
    const recorded = events();
    recorded.deps.liveAccount = async () => {
      recorded.calls.push("lookup");
      return { accountExists: false, sessionExists: false };
    };

    const decision = await settleAuthSession(claims, recorded.deps);

    assert.deepEqual(decision, { status: "revoked" });
    assert.deepEqual(recorded.calls, ["lookup", "clear"]);
  });

  test("clears the local session when the session row is gone", async () => {
    const recorded = events();
    recorded.deps.liveAccount = async () => {
      recorded.calls.push("lookup");
      return { accountExists: true, sessionExists: false };
    };

    const decision = await settleAuthSession(claims, recorded.deps);

    assert.deepEqual(decision, { status: "revoked" });
    assert.deepEqual(recorded.calls, ["lookup", "clear"]);
  });

  test("clears a jwt that cannot name a real session without querying", async () => {
    const recorded = events();
    const decision = await settleAuthSession(
      { sub: "Ada Lovelace", email, session_id: sessionId },
      recorded.deps,
    );

    assert.deepEqual(decision, { status: "revoked" });
    assert.deepEqual(recorded.calls, ["clear"]);
  });

  test("does not clear cookies when the live check fails", async () => {
    const recorded = events();
    recorded.deps.liveAccount = async () => {
      recorded.calls.push("lookup");
      throw new Error("database");
    };

    await assert.rejects(settleAuthSession(claims, recorded.deps), /database/);
    assert.deepEqual(recorded.calls, ["lookup"]);
  });

  test("still rejects the jwt when clearing the cookie throws", async () => {
    const recorded = events();
    recorded.deps.liveAccount = async () => {
      recorded.calls.push("lookup");
      return { accountExists: false, sessionExists: false };
    };
    recorded.deps.clearLocalSession = async () => {
      recorded.calls.push("clear");
      throw new Error("cookie");
    };

    const decision = await settleAuthSession(claims, recorded.deps);

    assert.deepEqual(decision, { status: "revoked" });
    assert.deepEqual(recorded.calls, ["lookup", "clear"]);
  });

  test("does not clear a live session that has no email claim", async () => {
    const recorded = events();
    const decision = await settleAuthSession(
      { sub: userId, session_id: sessionId },
      recorded.deps,
    );

    assert.deepEqual(decision, { status: "anonymous" });
    assert.deepEqual(recorded.calls, [`lookup:${userId}:${sessionId}`]);
  });

  test("clears the local session when auth reports the user is gone", async () => {
    const recorded = events();
    const ended = await clearSessionIfAuthEnded(
      { code: "user_not_found" },
      recorded.deps.clearLocalSession,
    );

    assert.equal(ended, true);
    assert.deepEqual(recorded.calls, ["clear"]);
  });

  test("clears the local session when auth reports the session is gone", async () => {
    const recorded = events();
    const ended = await clearSessionIfAuthEnded(
      { code: "session_not_found" },
      recorded.deps.clearLocalSession,
    );

    assert.equal(ended, true);
    assert.deepEqual(recorded.calls, ["clear"]);
  });

  test("keeps the cookie when auth fails for another reason", async () => {
    const recorded = events();
    const ended = await clearSessionIfAuthEnded(
      { code: "bad_jwt" },
      recorded.deps.clearLocalSession,
    );

    assert.equal(ended, false);
    assert.deepEqual(recorded.calls, []);
    assert.equal(
      await clearSessionIfAuthEnded(null, recorded.deps.clearLocalSession),
      false,
    );
  });

  test("does not look up or clear a request that has no user", async () => {
    const recorded = events();
    const decision = await settleAuthSession(null, recorded.deps);

    assert.deepEqual(decision, { status: "anonymous" });
    assert.deepEqual(recorded.calls, []);
  });
});
