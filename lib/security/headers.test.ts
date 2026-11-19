import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import {
  contentSecurityPolicy,
  securityHeaders,
} from "@/lib/security/headers";

import nextConfig from "../../next.config";

const directiveMap = (policy: string) => {
  return new Map(
    policy.split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name ?? "", values.join(" ")];
    }),
  );
};

const headerValue = (
  headers: { key: string; value: string }[],
  key: string,
) => {
  return headers.find((header) => header.key === key)?.value;
};

describe("security headers", () => {
  test("production baseline sets CSP, referrer policy, and frame protections", () => {
    const headers = securityHeaders({ development: false });
    const policy = headerValue(headers, "Content-Security-Policy");
    const directives = directiveMap(policy ?? "");

    assert.equal(
      headerValue(headers, "Referrer-Policy"),
      "strict-origin-when-cross-origin",
    );
    assert.equal(headerValue(headers, "X-Frame-Options"), "DENY");
    assert.equal(headerValue(headers, "X-Content-Type-Options"), "nosniff");
    assert.equal(
      headerValue(headers, "Cross-Origin-Opener-Policy"),
      "same-origin",
    );
    assert.equal(
      headerValue(headers, "Strict-Transport-Security"),
      "max-age=63072000",
    );
    const permissions = headerValue(headers, "Permissions-Policy") ?? "";

    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      assert.match(permissions, new RegExp(`${feature}=\\(\\)`));
    }

    assert.equal(directives.get("default-src"), "'self'");
    assert.equal(directives.get("script-src"), "'self' 'unsafe-inline'");
    assert.equal(directives.get("script-src-attr"), "'none'");
    assert.equal(directives.get("style-src"), "'self' 'unsafe-inline'");
    assert.equal(directives.has("style-src-elem"), false);
    assert.equal(directives.get("img-src"), "'self'");
    assert.equal(directives.get("font-src"), "'self'");
    assert.equal(directives.get("connect-src"), "'self'");
    assert.equal(directives.get("object-src"), "'none'");
    assert.equal(directives.get("base-uri"), "'self'");
    assert.equal(directives.get("form-action"), "'self'");
    assert.equal(directives.get("frame-src"), "'none'");
    assert.equal(directives.get("frame-ancestors"), "'none'");
    assert.equal(directives.get("worker-src"), "'self'");
    assert.equal(directives.get("upgrade-insecure-requests"), "");
    assert.equal(policy?.includes("supabase"), false);
    assert.equal(policy?.includes("https:"), false);
    assert.equal(policy?.includes("unsafe-eval"), false);
  });

  test("development keeps eval for React and does not upgrade http", () => {
    const headers = securityHeaders({ development: true });
    const directives = directiveMap(contentSecurityPolicy({ development: true }));

    assert.equal(
      directives.get("script-src"),
      "'self' 'unsafe-inline' 'unsafe-eval'",
    );
    assert.equal(directives.has("upgrade-insecure-requests"), false);
    assert.equal(headerValue(headers, "Strict-Transport-Security"), undefined);
    assert.equal(directives.get("connect-src"), "'self'");
  });

  test("next config applies one baseline to every path", async () => {
    assert.equal(typeof nextConfig.headers, "function");

    const rules = await nextConfig.headers();

    assert.deepEqual(rules, [
      {
        source: "/:path*",
        headers: securityHeaders({
          development: process.env.NODE_ENV === "development",
        }),
      },
    ]);
  });
});
