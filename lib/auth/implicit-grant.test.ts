import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import {
  implicitCallbackRewrite,
  implicitGrantPlan,
  isSameOrigin,
  readImplicitSessionBody,
} from "@/lib/auth/implicit-grant";

const accessToken = "header.payload.signature";
const refreshToken = "refresh-token-value";

const hash = (params: string) => `#${params}`;

const location = (pathname: string, search = "", hashValue = "") => {
  return { pathname, search, hash: hashValue };
};

describe("implicit confirmation grant", () => {
  test("keeps a callback without a code off the confirm error page", () => {
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        code: null,
        next: null,
      }),
      "/auth/session",
    );
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        code: null,
        next: "/cookbook",
      }),
      "/auth/session",
    );
  });

  test("leaves PKCE codes and password recovery on the callback route", () => {
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        code: "pkce-code",
        next: null,
      }),
      null,
    );
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/auth/callback",
        code: null,
        next: "/reset-password",
      }),
      null,
    );
    assert.equal(
      implicitCallbackRewrite({
        pathname: "/",
        code: null,
        next: null,
      }),
      null,
    );
  });

  test("plans to store a signup hash and then open a short URL", () => {
    const plan = implicitGrantPlan(
      location(
        "/",
        "",
        hash(
          `access_token=${accessToken}&refresh_token=${refreshToken}&type=signup`,
        ),
      ),
    );

    assert.equal(plan.action, "establish");

    if (plan.action !== "establish") {
      return;
    }

    assert.equal(plan.accessToken, accessToken);
    assert.equal(plan.refreshToken, refreshToken);
    assert.equal(plan.successPath, "/");
    assert.equal(plan.successPath.includes("access_token"), false);
    assert.equal(plan.successPath.includes("refresh_token"), false);
    assert.equal(plan.failurePath, "/login?error=confirm");
  });

  test("follows a safe next path from the callback hash", () => {
    const callback = implicitGrantPlan(
      location(
        "/auth/callback",
        "?next=/cookbook",
        hash(`access_token=${accessToken}&refresh_token=${refreshToken}`),
      ),
    );
    const unsafe = implicitGrantPlan(
      location(
        "/auth/session",
        "?next=https://evil.example",
        hash(`access_token=${accessToken}&refresh_token=${refreshToken}`),
      ),
    );
    const loop = implicitGrantPlan(
      location(
        "/auth/callback",
        "?next=/auth/callback",
        hash(`access_token=${accessToken}&refresh_token=${refreshToken}`),
      ),
    );

    assert.equal(callback.action, "establish");
    assert.equal(unsafe.action, "establish");
    assert.equal(loop.action, "establish");

    if (
      callback.action !== "establish" ||
      unsafe.action !== "establish" ||
      loop.action !== "establish"
    ) {
      return;
    }

    assert.equal(callback.successPath, "/cookbook");
    assert.equal(unsafe.successPath, "/");
    assert.equal(loop.successPath, "/");
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
