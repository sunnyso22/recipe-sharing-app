import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import {
  implicitCallbackRewrite,
  implicitGrantPlan,
  isSameOrigin,
  readImplicitSessionBody,
} from "@/lib/auth/implicit-grant";
import { confirmedSignInMessage, confirmedSignInPath } from "@/lib/auth/paths";

const accessToken = "header.payload.signature";
const refreshToken = "refresh-token-value";

const hash = (params: string) => `#${params}`;

const location = (pathname: string, search = "", hashValue = "") => {
  return { pathname, search, hash: hashValue };
};

describe("implicit confirmation grant", () => {
  test("rewrites signup confirmation, including a code, off the exchange route", () => {
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        next: null,
      }),
      "/auth/session",
    );
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        next: "/cookbook",
      }),
      "/auth/session",
    );
  });

  test("leaves password recovery on the callback route", () => {
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        next: "/reset-password",
      }),
      null,
    );
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/",
        next: null,
      }),
      null,
    );
  });

  test("sends a signup hash to sign-in without keeping the session", () => {
    const plan = implicitGrantPlan(
      location(
        "/",
        "",
        hash(
          `access_token=${accessToken}&refresh_token=${refreshToken}&type=signup`,
        ),
      ),
    );

    assert.deepEqual(plan, {
      action: "replace",
      path: confirmedSignInPath,
    });
    assert.equal(confirmedSignInMessage, "Email confirmed. Sign in to continue.");
    assert.equal(confirmedSignInPath.includes("access_token"), false);
    assert.equal(confirmedSignInPath.includes(accessToken), false);
    assert.equal(confirmedSignInPath.includes(refreshToken), false);
  });

  test("sends a callback code to sign-in instead of exchanging it", () => {
    const callback = implicitGrantPlan(
      location("/auth/callback", "?code=pkce-code"),
    );
    const withNext = implicitGrantPlan(
      location(
        "/auth/callback",
        "?code=pkce-code&next=/cookbook",
        hash(`access_token=${accessToken}&refresh_token=${refreshToken}`),
      ),
    );

    assert.deepEqual(callback, {
      action: "replace",
      path: confirmedSignInPath,
    });
    assert.deepEqual(withNext, {
      action: "replace",
      path: confirmedSignInPath,
    });
  });

  test("still stores a recovery hash so password reset can continue", () => {
    const plan = implicitGrantPlan(
      location(
        "/auth/callback",
        "?next=/reset-password",
        hash(
          `access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`,
        ),
      ),
    );

    assert.equal(plan.action, "establish");

    if (plan.action !== "establish") {
      return;
    }

    assert.equal(plan.successPath, "/reset-password");
    assert.equal(plan.successPath.includes(accessToken), false);
  });

  test("strips an auth error hash instead of leaving it in the address bar", () => {
    const plan = implicitGrantPlan(
      location(
        "/",
        "",
        hash("error=access_denied&error_code=otp_expired&type=signup"),
      ),
    );

    assert.deepEqual(plan, {
      action: "replace",
      path: "/login?error=confirm",
    });
  });

  test("sends a callback with no grant to the confirm error page", () => {
    assert.deepEqual(implicitGrantPlan(location("/auth/callback")), {
      action: "replace",
      path: "/login?error=confirm",
    });
    assert.deepEqual(
      implicitGrantPlan(location("/auth/session", "?next=/reset-password")),
      {
        action: "replace",
        path: "/forgot-password?error=expired",
      },
    );
  });

  test("ignores a hash that is not an auth grant", () => {
    assert.deepEqual(implicitGrantPlan(location("/recipes/1", "", "#method")), {
      action: "stay",
    });
    assert.deepEqual(implicitGrantPlan(location("/", "", "")), {
      action: "stay",
    });
  });

  test("rejects a partial or oversized token", () => {
    assert.deepEqual(
      implicitGrantPlan(
        location("/", "", hash(`access_token=${accessToken}&type=signup`)),
      ),
      {
        action: "replace",
        path: "/login?error=confirm",
      },
    );
    assert.equal(
      readImplicitSessionBody({
        accessToken: `${"a".repeat(8193)}`,
        refreshToken,
      }),
      null,
    );
    assert.deepEqual(
      readImplicitSessionBody({ accessToken, refreshToken }),
      { accessToken, refreshToken },
    );
  });

  test("accepts only a same-origin session request", () => {
    assert.equal(
      isSameOrigin(
        "https://cookery.sunnyso22.dev",
        "https://cookery.sunnyso22.dev",
      ),
      true,
    );
    assert.equal(
      isSameOrigin("https://evil.example", "https://cookery.sunnyso22.dev"),
      false,
    );
    assert.equal(isSameOrigin(null, "https://cookery.sunnyso22.dev"), false);
  });
});
