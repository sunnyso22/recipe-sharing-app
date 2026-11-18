import assert from "node:assert/strict";

import { describe, test } from "bun:test";

import { confirmationRedirectUrl } from "@/lib/auth/email-redirect";

const productionCallback = "https://cookery.sunnyso22.dev/auth/callback";

describe("confirmation redirect", () => {
  test("uses the configured site origin in production", () => {
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: "https://cookery.sunnyso22.dev",
        nodeEnv: "production",
        host: "recipe-sharing-app-git-preview.vercel.app",
      }),
      productionCallback,
    );
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: "https://cookery.sunnyso22.dev/",
        nodeEnv: "production",
        host: null,
      }),
      productionCallback,
    );
  });

  test("ignores a preview host when the site URL is missing", () => {
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: undefined,
        nodeEnv: "production",
        host: "recipe-sharing-app-abc123.vercel.app",
      }),
      null,
    );
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: "   ",
        nodeEnv: "production",
        host: "localhost:3000",
      }),
      null,
    );
  });

  test("uses localhost only for local development", () => {
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: undefined,
        nodeEnv: "development",
        host: "localhost:3000",
      }),
      "http://localhost:3000/auth/callback",
    );
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: undefined,
        nodeEnv: "development",
        host: "127.0.0.1:3000",
      }),
      "http://127.0.0.1:3000/auth/callback",
    );
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: undefined,
        nodeEnv: "development",
        host: "evil.example",
      }),
      null,
    );
  });

  test("prefers the site URL over the local host", () => {
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: "https://cookery.sunnyso22.dev",
        nodeEnv: "development",
        host: "localhost:3000",
      }),
      productionCallback,
    );
  });

  test("rejects a site URL with credentials or a non-http protocol", () => {
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: "https://user:secret@cookery.sunnyso22.dev",
        nodeEnv: "production",
        host: null,
      }),
      null,
    );
    assert.equal(
      confirmationRedirectUrl({
        siteUrl: "javascript:alert(1)",
        nodeEnv: "production",
        host: null,
      }),
      null,
    );
  });
});
