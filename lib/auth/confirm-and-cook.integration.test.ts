import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, beforeEach, describe, mock, test } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { NextRequest } from "next/server";
import postgres, { type Sql } from "postgres";

const browsers = new Map<string, Map<string, string>>();
let activeBrowser = "one";

const jar = () => {
  const current = browsers.get(activeBrowser) ?? new Map<string, string>();
  browsers.set(activeBrowser, current);
  return current;
};

const cookieHeader = () => {
  return [...jar()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
};

const headerState = () => {
  const host = process.env.TEST_HOST ?? "localhost:3000";
  const headers = new Headers({
    host,
    origin: `http://${host}`,
  });
  const cookie = cookieHeader();

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return headers;
};

const rememberCookie = (name: string, value: string) => {
  if (value.length === 0) {
    jar().delete(name);
    return;
  }

  jar().set(name, value);
};

const nextHeaders = () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = jar().get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll: () => {
      return [...jar()].map(([name, value]) => ({ name, value }));
    },
    has: (name: string) => jar().has(name),
    set: (name: string, value: string) => {
      rememberCookie(name, value);
    },
    delete: (name: string) => {
      jar().delete(name);
    },
  }),
  headers: async () => headerState(),
});

mock.module("next/headers", nextHeaders);
mock.module("next/headers.js", nextHeaders);

mock.module("next/cache", () => ({
  io: async () => {},
  revalidatePath: () => {},
  revalidateTag: () => {},
  cacheLife: () => {},
  cacheTag: () => {},
}));

mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const postgresBin = () => {
  try {
    const versions = readdirSync("/usr/lib/postgresql").sort().reverse();
    return versions[0]
      ? path.join("/usr/lib/postgresql", versions[0], "bin")
      : null;
  } catch {
    return null;
  }
};

const quoteIdent = (value: string) => {
  return `"${value.replaceAll('"', '""')}"`;
};

const freePort = async () => {
  const server = createServer();
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
};

const checkYourEmail =
  "Check your email for a link to confirm it and sign in.";

const recipeInput = (title: string) => ({
  title,
  description: "Warm soup",
  ingredients: [{ name: "Onion", quantity: "1" }],
  seasonings: [{ name: "Salt", quantity: "1 tsp" }],
  instructions: [{ description: "Simmer" }],
});

describe("confirm and cook", () => {
  const bin = postgresBin();
  let admin: Sql | null = null;
  let databaseUrl = "";
  let dockerName = "";
  let dataDir = "";
  const stopLocal = () => {
    if (!bin || !dataDir) {
      return;
    }

    execFileSync(path.join(bin, "pg_ctl"), [
      "-D",
      dataDir,
      "-m",
      "immediate",
      "stop",
    ]);
  };

  const useBrowser = (name: string) => {
    activeBrowser = name;
    if (!browsers.has(name)) {
      browsers.set(name, new Map());
    }
  };

  const load = async () => {
    const actions = await import("@/app/login/actions");
    const recipes = await import("@/app/recipes/new/actions");
    const edits = await import("@/app/recipes/[id]/edit/actions");
    const engagement = await import("@/app/recipes/[id]/actions");
    const settings = await import("@/app/settings/actions");
    const confirmRoute = await import("@/app/api/auth/[...all]/route");
    const session = await import("@/lib/auth/session");
    const queries = await import("@/db/queries/recipes");
    const accounts = await import("@/db/queries/accounts");
    const marks = await import("@/db/queries/engagement");
    const mailbox = await import("@/lib/mail/mailbox");
    const gate = await import("@/lib/auth/gate");
    const authModule = await import("@/lib/auth/auth");
    const form = await import("@/lib/auth/form");

    return {
      ...actions,
      ...recipes,
      ...edits,
      ...engagement,
      ...settings,
      ...confirmRoute,
      ...session,
      ...queries,
      ...accounts,
      ...marks,
      ...mailbox,
      ...gate,
      ...authModule,
      ...form,
    };
  };

  const formData = (fields: Record<string, string>) => {
    const data = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      data.set(key, value);
    }

    return data;
  };

  const redirected = async (run: () => Promise<unknown>) => {
    try {
      return { result: await run(), path: null as string | null };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT:")) {
        return {
          result: null,
          path: error.message.slice("NEXT_REDIRECT:".length),
        };
      }

      throw error;
    }
  };

  const storeResponseCookies = (response: Response) => {
    const cookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];

    for (const cookie of cookies) {
      const [pair] = cookie.split(";");
      const separator = pair.indexOf("=");

      if (separator > 0) {
        rememberCookie(pair.slice(0, separator), pair.slice(separator + 1));
      }
    }
  };

  const sessionCookie = () => {
    return [...jar().keys()].find((name) => name.includes("session_token"));
  };

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET =
      "cookery-test-secret-0123456789abcdef";
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.RESEND_API_KEY;

    if (bin) {
      dataDir = mkdtempSync(path.join(tmpdir(), "cookery-auth-"));
      const socketDir = mkdtempSync(path.join(tmpdir(), "cookery-auth-socket-"));
      const port = await freePort();
      execFileSync(path.join(bin, "initdb"), [
        "-D",
        dataDir,
        "--username=postgres",
        "--auth=trust",
        "--no-instructions",
      ]);
      execFileSync(path.join(bin, "pg_ctl"), [
        "-D",
        dataDir,
        "-l",
        path.join(dataDir, "server.log"),
        "-w",
        "start",
        "-o",
        `-p ${port} -k ${socketDir} -c listen_addresses=`,
      ]);
      databaseUrl = `postgres://postgres@/postgres?host=${socketDir}&port=${port}`;
    } else {
      dockerName = `cookery-auth-${process.pid}`;
      execFileSync("docker", ["rm", "-f", dockerName], { stdio: "ignore" });
      execFileSync("docker", [
        "run",
        "-d",
        "--name",
        dockerName,
        "-e",
        "POSTGRES_HOST_AUTH_METHOD=trust",
        "-e",
        "POSTGRES_USER=postgres",
        "-p",
        "127.0.0.1::5432",
        "postgres:17-alpine",
      ]);
      const mapping = execFileSync("docker", ["port", dockerName, "5432"], {
        encoding: "utf8",
      });
      const port = mapping.trim().split(":").pop();
      databaseUrl = `postgres://postgres@127.0.0.1:${port}/postgres`;
    }

    admin = postgres(databaseUrl, { max: 1 });

    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        await admin`select 1`;
        break;
      } catch (error) {
        if (attempt === 39) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    await admin.unsafe(`
      do $$
      begin
        begin create role anon nologin; exception when duplicate_object then null; end;
        begin create role authenticated nologin; exception when duplicate_object then null; end;
        begin create role authenticator noinherit login; exception when duplicate_object then null; end;
        begin create role service_role nologin; exception when duplicate_object then null; end;
      end $$;
    `);
    await admin.unsafe("grant anon to authenticator");
    await admin.unsafe("grant authenticated to authenticator");
    await admin.unsafe(`create database ${quoteIdent("cookery_confirm")}`);
    const setup = postgres(databaseUrl.replace(/\/postgres(\?|$)/, "/cookery_confirm$1"), {
      max: 1,
    });

    try {
      await setup.unsafe(`
        create schema auth;
        create table auth.users (id uuid primary key);
        create function auth.uid()
        returns uuid
        language sql
        stable
        as $$
          select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
        $$;
      `);
      await migrate(drizzle({ client: setup }), {
        migrationsFolder: path.join(import.meta.dir, "../../drizzle"),
      });
    } finally {
      await setup.end();
    }

    databaseUrl = databaseUrl.replace(/\/postgres(\?|$)/, "/cookery_confirm$1");
    process.env.DATABASE_URL = databaseUrl;
  }, 120_000);

  beforeEach(() => {
    browsers.clear();
    useBrowser("one");
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    process.env.TEST_HOST = "localhost:3000";
  });

  afterAll(async () => {
    await admin?.end();

    if (dockerName) {
      execFileSync("docker", ["rm", "-f", dockerName], { stdio: "ignore" });
    }

    stopLocal();

    if (dataDir) {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  const signUpFields = (
    email: string,
    name = "Ada Lovelace",
    password = "longpass",
  ) => {
    return formData({
      name,
      email,
      password,
      confirmPassword: password,
    });
  };

  test("sign-up creates no session and shows one check-your-email screen", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "ada@example.com";
    const state = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email),
    );

    assert.equal(state.status, "success");
    assert.equal(state.message, checkYourEmail);
    assert.equal(sessionCookie(), undefined);
    assert.equal(await app.getAuthUser(), null);
    assert.equal(mailbox.messages.length, 1);
    assert.equal(mailbox.messages[0]?.to, email);
    mailbox.stop();
  }, 20_000);

  test("rejects an empty display name and a short password", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const emptyName = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields("empty-name@example.com", "  "),
    );
    const shortPassword = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields("short@example.com", "Ada Lovelace", "short"),
    );

    assert.equal(emptyName.status, "error");
    assert.equal(emptyName.message, "Enter a display name.");
    assert.equal(shortPassword.status, "error");
    assert.equal(shortPassword.message, "Use at least 8 characters.");
    assert.equal(mailbox.messages.length, 0);
    mailbox.stop();
  }, 20_000);

  test("keeps one screen and the first password when sign-up is repeated", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "repeat@example.com";
    const first = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Ada Lovelace", "firstpass"),
    );
    const live = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Grace Hopper", "otherpass"),
    );

    assert.equal(first.message, checkYourEmail);
    assert.equal(live.message, checkYourEmail);
    assert.equal(mailbox.messages.length, 1);
    assert.equal(sessionCookie(), undefined);

    const link = mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0];
    assert.ok(link);
    const opened = await app.GET(new Request(link));
    storeResponseCookies(opened);
    assert.equal(opened.status, 302);
    assert.equal(new URL(opened.headers.get("location") ?? "", link).pathname, "/");
    assert.ok(sessionCookie());
    assert.equal((await app.getAuthUser())?.name, "Ada Lovelace");

    await redirected(() => app.signOutAction());
    const original = await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email, password: "firstpass" }),
      ),
    );
    const replaced = await app.signInAction(
      app.initialAuthFormState,
      formData({ email, password: "otherpass" }),
    );

    assert.equal(original.path, "/");
    assert.equal(replaced.message, "Email or password is incorrect.");
    mailbox.stop();
  }, 20_000);

  test("sends a new confirmation only after the previous link expires", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "expired@example.com";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Ada Lovelace", "firstpass"),
    );
    const stale = mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? "";
    const sql = postgres(databaseUrl, { max: 1 });

    try {
      const [person] = await sql`select id from "user" where email = ${email}`;
      await sql`
        update verification
        set expires_at = timestamp '2000-01-01'
        where identifier = ${`confirm:${person?.id}`}
      `;
    } finally {
      await sql.end();
    }

    const expiredResponse = await app.GET(new Request(stale));
    assert.equal(
      new URL(expiredResponse.headers.get("location") ?? "", stale).pathname,
      "/login",
    );
    assert.equal(sessionCookie(), undefined);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const again = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Grace Hopper", "otherpass"),
    );

    assert.equal(again.message, checkYourEmail);
    assert.equal(mailbox.messages.length, 2);
    const verified = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields("verified-later@example.com"),
    );
    assert.equal(verified.message, checkYourEmail);
    assert.equal(mailbox.messages.length, 3);
    const fresh = mailbox.messages[1]?.text.match(/https?:\/\/\S+/)?.[0] ?? "";
    assert.notEqual(fresh, stale);
    const staleResponse = await app.GET(new Request(stale));
    assert.equal(
      new URL(staleResponse.headers.get("location") ?? "", stale).pathname,
      "/login",
    );
    assert.equal(sessionCookie(), undefined);

    const freshResponse = await app.GET(new Request(fresh));
    storeResponseCookies(freshResponse);
    assert.equal((await app.getAuthUser())?.name, "Ada Lovelace");
    await redirected(() => app.signOutAction());
    const signedIn = await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email, password: "firstpass" }),
      ),
    );
    assert.equal(signedIn.path, "/");

    const before = mailbox.messages.length;
    const repeatVerified = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Changed", "thirdpass"),
    );
    assert.equal(repeatVerified.message, checkYourEmail);
    assert.equal(mailbox.messages.length, before);
    mailbox.stop();
  }, 30_000);

  test("a failed send leaves no live link and the next sign-up can send", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "failed-send@example.com";
    mailbox.failNextSend();
    const failed = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Ada Lovelace", "firstpass"),
    );
    const sent = await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Grace Hopper", "otherpass"),
    );
    const link = mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? "";
    const opened = await app.GET(new Request(link));
    storeResponseCookies(opened);

    assert.equal(failed.message, checkYourEmail);
    assert.equal(sent.message, checkYourEmail);
    assert.equal(mailbox.messages.length, 1);
    assert.equal((await app.getAuthUser())?.name, "Ada Lovelace");
    await redirected(() => app.signOutAction());
    const original = await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email, password: "firstpass" }),
      ),
    );
    assert.equal(original.path, "/");
    mailbox.stop();
  }, 20_000);

  test("writes the Cookery confirmation and points the link at this environment", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields("local@example.com", "Ada Lovelace"),
    );
    const local = mailbox.messages[0];
    assert.ok(local);
    assert.equal(local.from, "Cookery <noreply@cookery.sunnyso22.dev>");
    assert.equal(local.replyTo, local.from);
    assert.equal(local.subject, "Confirm your email for Cookery");
    assert.equal(local.openTracking, false);
    assert.equal(local.clickTracking, false);
    assert.equal(local.html.includes("<img"), false);
    assert.match(local.html, /Cookery/);
    assert.match(local.html, /#f6f1ea/);
    assert.match(local.html, /#f3eadc/);
    assert.match(local.html, /#44403c/);
    assert.match(local.html, /#8c4a2f/);
    assert.match(local.html, /Hello Ada Lovelace,/);
    assert.match(
      local.html,
      /Verify your email to sign in to Cookery\. This link lasts 10 minutes\./,
    );
    assert.match(local.html, /Confirm and sign in/);
    assert.match(local.text, /Hello Ada Lovelace,/);
    assert.match(
      local.text,
      /Verify your email to sign in to Cookery\. This link lasts 10 minutes\./,
    );
    assert.match(local.text, /^http:\/\/localhost:3000\/api\/auth\/verify-email/m);

    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "preview-cookery.vercel.app";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields("preview@example.com"),
    );
    assert.match(
      mailbox.messages[1]?.text ?? "",
      /^https:\/\/preview-cookery\.vercel\.app\/api\/auth\/verify-email/m,
    );

    process.env.VERCEL_ENV = "production";
    process.env.TEST_HOST = "evil.example";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields("production@example.com"),
    );
    assert.match(
      mailbox.messages[2]?.text ?? "",
      /^https:\/\/cookery\.sunnyso22\.dev\/api\/auth\/verify-email/m,
    );
    mailbox.stop();
  }, 20_000);

  test("sign-in creates a session only for a verified user and sends no message", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "signin@example.com";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Ada Lovelace", "longpass"),
    );
    const unverified = await app.signInAction(
      app.initialAuthFormState,
      formData({ email, password: "longpass" }),
    );
    const unknown = await app.signInAction(
      app.initialAuthFormState,
      formData({ email: "missing@example.com", password: "longpass" }),
    );

    assert.equal(unverified.message, "Email or password is incorrect.");
    assert.equal(unknown.message, "Email or password is incorrect.");
    assert.equal(mailbox.messages.length, 1);
    assert.equal(sessionCookie(), undefined);

    const link = mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? "";
    storeResponseCookies(await app.GET(new Request(link)));
    await redirected(() => app.signOutAction());
    const wrong = await app.signInAction(
      app.initialAuthFormState,
      formData({ email, password: "wrongpass" }),
    );
    const right = await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email, password: "longpass" }),
      ),
    );

    assert.equal(wrong.message, "Email or password is incorrect.");
    assert.equal(right.path, "/");
    assert.equal(mailbox.messages.length, 1);
    assert.ok(sessionCookie());
    mailbox.stop();
  }, 20_000);

  test("sign-out ends one browser and a used session lasts seven days", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "sessions@example.com";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email),
    );
    const link = mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? "";
    storeResponseCookies(await app.GET(new Request(link)));
    const first = await app.auth.api.getSession({ headers: headerState() });
    const expiresAt = new Date(first?.session.expiresAt ?? 0).getTime();
    assert.ok(
      Math.abs(expiresAt - Date.now() - 7 * 24 * 60 * 60 * 1000) < 120_000,
    );

    useBrowser("two");
    await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email, password: "longpass" }),
      ),
    );
    assert.ok(sessionCookie());
    useBrowser("one");
    await redirected(() => app.signOutAction());
    assert.equal(await app.getAuthUser(), null);
    useBrowser("two");
    assert.equal((await app.getAuthUser())?.email, email);

    const sql = postgres(databaseUrl, { max: 1 });

    try {
      await sql`
        update session
        set
          updated_at = now() - interval '2 days',
          expires_at = now() + interval '4 days'
        where user_id = (select id from "user" where email = ${email})
      `;
    } finally {
      await sql.end();
    }

    const extended = await app.auth.api.getSession({ headers: headerState() });
    const nextExpiry = new Date(extended?.session.expiresAt ?? 0).getTime();
    assert.ok(nextExpiry - Date.now() > 6 * 24 * 60 * 60 * 1000);
    mailbox.stop();
  }, 20_000);

  test("a used confirmation link leaves the browser signed out", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "used-link@example.com";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Ada Lovelace", "longpass"),
    );
    const link = mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? "";
    storeResponseCookies(await app.GET(new Request(link)));
    await redirected(() => app.signOutAction());
    useBrowser("fresh");
    const again = await app.GET(new Request(link));

    assert.equal(again.status, 302);
    assert.equal(
      new URL(again.headers.get("location") ?? "", link).search,
      "?error=confirm",
    );
    assert.equal(sessionCookie(), undefined);
    const signedIn = await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email, password: "longpass" }),
      ),
    );
    assert.equal(signedIn.path, "/");
    mailbox.stop();
  }, 20_000);

  test("signed-out visitors can read a recipe and only a session can change it", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const ownerEmail = "owner@example.com";
    const otherEmail = "other@example.com";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(ownerEmail, "Ada Lovelace"),
    );
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(otherEmail, "Ada Lovelace"),
    );
    storeResponseCookies(
      await app.GET(
        new Request(mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? ""),
      ),
    );

    const created = await redirected(() =>
      app.createRecipeAction({ message: "" }, recipeInput("Soup")),
    );
    const recipeId = Number(created.path?.split("/").pop());
    const recipe = await app.getRecipeByParam(String(recipeId));
    assert.ok(recipe);
    assert.equal(await app.getRecipeAuthorName(recipe.userId), "Ada Lovelace");

    useBrowser("visitor");
    assert.equal(await app.getAuthUser(), null);
    assert.equal(
      (await app.getRecipeEngagement(recipeId)).likeCount,
      0,
    );
    const blocked = await redirected(() =>
      app.createRecipeAction({ message: "" }, recipeInput("Nope")),
    );
    assert.equal(blocked.path, "/login");

    useBrowser("one");
    await app.setRecipeLikeAction(recipeId, true);
    await app.setRecipeBookmarkAction(recipeId, true);
    useBrowser("visitor");
    const counted = await app.getRecipeEngagement(recipeId);
    assert.equal(counted.likeCount, 1);
    assert.equal(counted.liked, false);

    useBrowser("other");
    storeResponseCookies(
      await app.GET(
        new Request(mailbox.messages[1]?.text.match(/https?:\/\/\S+/)?.[0] ?? ""),
      ),
    );
    const foreignUpdate = await app.updateRecipeAction(
      recipeId,
      { message: "" },
      recipeInput("Stolen"),
    );
    const foreignDelete = await app.deleteRecipeAction(
      { message: "" },
      formData({ recipeId: String(recipeId) }),
    );
    await app.setRecipeLikeAction(recipeId, false);
    assert.equal(foreignUpdate.message, "This recipe could not be updated.");
    assert.equal(foreignDelete.message, "This recipe could not be deleted.");
    assert.equal((await app.getRecipeEngagement(recipeId)).likeCount, 1);
    assert.equal((await app.getRecipeByParam(String(recipeId)))?.title, "Soup");

    const secondBrowser = "owner-two";
    useBrowser(secondBrowser);
    await redirected(() =>
      app.signInAction(
        app.initialAuthFormState,
        formData({ email: ownerEmail, password: "longpass" }),
      ),
    );
    const edited = await redirected(() =>
      app.updateRecipeAction(recipeId, { message: "" }, recipeInput("Stew")),
    );
    assert.equal(edited.path, `/recipes/${recipeId}`);
    assert.equal((await app.getRecipeByParam(String(recipeId)))?.title, "Stew");

    useBrowser("one");
    await app.setRecipeLikeAction(recipeId, false);
    assert.equal((await app.getRecipeEngagement(recipeId)).likeCount, 0);
    const removed = await redirected(() =>
      app.deleteRecipeAction(
        { message: "" },
        formData({ recipeId: String(recipeId), next: "/cookbook" }),
      ),
    );
    assert.equal(removed.path, "/cookbook");
    assert.equal(await app.getRecipeByParam(String(recipeId)), null);

    for (const pathname of [
      "/cookbook",
      "/bookmarks",
      "/settings",
      "/recipes/new",
      `/recipes/${recipeId}/edit`,
    ]) {
      useBrowser("visitor");
      const response = app.gateRequest(
        new NextRequest(`http://localhost:3000${pathname}`),
      );
      assert.equal(response.headers.get("location"), "http://localhost:3000/login");
    }

    useBrowser("one");
    const allowed = app.gateRequest(
      new NextRequest("http://localhost:3000/cookbook", {
        headers: { cookie: cookieHeader() },
      }),
    );
    assert.equal(allowed.headers.get("location"), null);
    mailbox.stop();
  }, 30_000);

  test("deleting a user deletes that user's recipes and the Data API cannot read them", async () => {
    const app = await load();
    const mailbox = app.captureMailbox();
    const email = "delete-me@example.com";
    await app.signUpAction(
      app.initialAuthFormState,
      signUpFields(email, "Ada Lovelace", "longpass"),
    );
    storeResponseCookies(
      await app.GET(
        new Request(mailbox.messages[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? ""),
      ),
    );
    const created = await redirected(() =>
      app.createRecipeAction({ message: "" }, recipeInput("Gone")),
    );
    const recipeId = Number(created.path?.split("/").pop());
    await app.setRecipeLikeAction(recipeId, true);
    await app.setRecipeBookmarkAction(recipeId, true);
    await redirected(() =>
      app.deleteAccountAction(
        { status: "idle", message: "", values: {} },
        formData({ password: "longpass" }),
      ),
    );

    assert.equal(await app.getRecipeByParam(String(recipeId)), null);
    assert.equal(await app.getAuthUser(), null);

    const sql = postgres(databaseUrl, { max: 1 });

    try {
      const denied = await sql.begin(async (tx) => {
        await tx`set local role service_role`;
        return tx`select id from "user"`;
      }).catch((error: Error) => error.message);
      assert.match(String(denied), /permission denied/);

      const anon = await sql.begin(async (tx) => {
        await tx`set local role anon`;
        return tx`select id from recipes`;
      }).catch((error: Error) => error.message);
      assert.match(String(anon), /permission denied/);
      const [authUsers] = await sql`
        select to_regclass('auth.users') as name
      `;
      assert.equal(authUsers?.name, null);
    } finally {
      await sql.end();
    }

    mailbox.stop();
  }, 20_000);
});
