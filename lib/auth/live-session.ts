import * as z from "zod";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type SessionClaims = {
  sub?: unknown;
  email?: unknown;
  session_id?: unknown;
  user_metadata?: { name?: unknown };
};

type LiveAccount = {
  accountExists: boolean;
  sessionExists: boolean;
};

type AuthDecision =
  | { status: "anonymous" }
  | { status: "active"; user: AuthUser }
  | { status: "revoked" };

type LiveAccountLookup = (ids: {
  userId: string;
  sessionId: string;
}) => Promise<LiveAccount>;

type SettleAuthSessionDeps = {
  liveAccount: LiveAccountLookup;
  clearLocalSession: () => Promise<void>;
};

const claimString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// The Auth users list shows raw_user_meta_data.name as Display name.
const readDisplayName = (
  metadata: { name?: unknown } | undefined,
  email: string,
) => {
  const name = claimString(metadata?.name);

  if (name) {
    return name;
  }

  const local = email.split("@")[0];
  return local && local.length > 0 ? local : email;
};

const isUuid = (value: string) => {
  return z.uuid().safeParse(value).success;
};

// getClaims() proves the JWT signature and expiry. It does not prove the
// account or the auth.sessions row still exist, so a deleted user's access
// token stays "valid" until it expires. Authorization stays on the auth user
// id. A missing account or a missing session for that id is signed out.
const decideAuthSession = (
  claims: SessionClaims | null | undefined,
  live: LiveAccount | null,
): AuthDecision => {
  const id = claimString(claims?.sub);
  const email = claimString(claims?.email);
  const sessionId = claimString(claims?.session_id);

  if (!id) {
    return { status: "anonymous" };
  }

  const accountLive =
    live?.accountExists === true &&
    live.sessionExists === true &&
    isUuid(id) &&
    sessionId !== null &&
    isUuid(sessionId);

  if (!accountLive) {
    return { status: "revoked" };
  }

  if (!email) {
    return { status: "anonymous" };
  }

  return {
    status: "active",
    user: {
      id,
      email,
      name: readDisplayName(claims?.user_metadata, email),
    },
  };
};

const clearRevokedSession = async (clearLocalSession: () => Promise<void>) => {
  try {
    await clearLocalSession();
  } catch {
    // The account or session is already gone. This browser may keep the
    // cookie until a later response can expire it.
  }
};

// GoTrue answers a deleted user with user_not_found before it checks the
// session, and supabase-js only drops the stored session for session_not_found.
const clearSessionIfAuthEnded = async (
  error: { code?: unknown } | null | undefined,
  clearLocalSession: () => Promise<void>,
) => {
  const code = error?.code;

  if (code !== "user_not_found" && code !== "session_not_found") {
    return false;
  }

  await clearRevokedSession(clearLocalSession);
  return true;
};

const settleAuthSession = async (
  claims: SessionClaims | null | undefined,
  deps: SettleAuthSessionDeps,
): Promise<AuthDecision> => {
  const id = claimString(claims?.sub);
  const sessionId = claimString(claims?.session_id);

  if (!id) {
    return { status: "anonymous" };
  }

  if (!sessionId || !isUuid(id) || !isUuid(sessionId)) {
    await clearRevokedSession(deps.clearLocalSession);
    return { status: "revoked" };
  }

  const live = await deps.liveAccount({ userId: id, sessionId });
  const decision = decideAuthSession(claims, live);

  if (decision.status === "revoked") {
    await clearRevokedSession(deps.clearLocalSession);
  }

  return decision;
};

export {
  clearSessionIfAuthEnded,
  decideAuthSession,
  readDisplayName,
  settleAuthSession,
};
export type { AuthDecision, AuthUser, LiveAccount, SessionClaims };
