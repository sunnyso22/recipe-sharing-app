import {
  authCallbackPath,
  authSessionPath,
  confirmedSignInPath,
  confirmErrorPath,
  recoveryErrorPath,
  resetPasswordPath,
  safeNextPath,
} from "@/lib/auth/paths";

const maxTokenLength = 8192;

type AuthLocation = {
  pathname: string;
  search: string;
  hash: string;
};

type ImplicitSession = {
  accessToken: string;
  refreshToken: string;
};

type ImplicitGrantSession = ImplicitSession & {
  type: string | null;
};

type ImplicitGrantPlan =
  | { action: "stay" }
  | { action: "replace"; path: string }
  | ({
      action: "establish";
      successPath: string;
      failurePath: string;
    } & ImplicitSession);

const tokenValue = (value: string | null) => {
  if (!value || value.length > maxTokenLength || /\s/.test(value)) {
    return null;
  }

  return value;
};

const parseImplicitGrant = (
  hash: string,
): { kind: "session"; session: ImplicitGrantSession } | { kind: "error" } | null => {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!fragment) {
    return null;
  }

  let params: URLSearchParams;

  try {
    params = new URLSearchParams(fragment);
  } catch {
    return null;
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const authError = Boolean(
    params.get("error_code") || params.get("error_description"),
  );

  if (!accessToken && !refreshToken && !authError) {
    return null;
  }

  if (authError) {
    return { kind: "error" };
  }

  const access = tokenValue(accessToken);
  const refresh = tokenValue(refreshToken);

  if (!access || !refresh) {
    return { kind: "error" };
  }

  return {
    kind: "session",
    session: {
      accessToken: access,
      refreshToken: refresh,
      type: params.get("type"),
    },
  };
};

const confirmationNextPath = (next: string | null) => {
  const path = safeNextPath(next);

  try {
    const url = new URL(path, "http://localhost");

    if (
      url.pathname === authCallbackPath ||
      url.pathname === authSessionPath
    ) {
      return "/";
    }
  } catch {
    return "/";
  }

  return path;
};

const pathWithoutSessionParams = (pathname: string, search: string) => {
  const params = new URLSearchParams(search);
  params.delete("access_token");
  params.delete("refresh_token");
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname || "/";
};

const handoffPath = (pathname: string) => {
  return pathname === authCallbackPath || pathname === authSessionPath;
};

// The server never receives #access_token=. Rewrite confirmation landings,
// including ?code=, so the browser can drop that URL. Password recovery stays
// on the callback route, which still exchanges its code and keeps the session.
const implicitCallbackRewrite = ({
  pathname,
  next,
}: {
  pathname: string;
  next: string | null;
}) => {
  if (pathname !== authCallbackPath) {
    return null;
  }

  if (safeNextPath(next) === resetPasswordPath) {
    return null;
  }

  return authSessionPath;
};

const implicitGrantPlan = (location: AuthLocation): ImplicitGrantPlan => {
  const grant = parseImplicitGrant(location.hash);
  const handoff = handoffPath(location.pathname);
  const next = new URLSearchParams(location.search).get("next");
  const recovering = safeNextPath(next) === resetPasswordPath;
  const failurePath = recovering ? recoveryErrorPath : confirmErrorPath;
  const successPath = handoff
    ? confirmationNextPath(next)
    : pathWithoutSessionParams(location.pathname, location.search);

  const confirmed = { action: "replace" as const, path: confirmedSignInPath };

  if (grant?.kind === "error") {
    return { action: "replace", path: failurePath };
  }

  // Recovery still needs the session so the user can choose a new password.
  if (grant?.kind === "session" && grant.session.type === "recovery") {
    return {
      action: "establish",
      accessToken: grant.session.accessToken,
      refreshToken: grant.session.refreshToken,
      successPath,
      failurePath,
    };
  }

  // Signup confirmation already happened at Auth. Do not store the session.
  if (grant?.kind === "session") {
    return confirmed;
  }

  const code = new URLSearchParams(location.search).get("code");

  if (code && !recovering) {
    return confirmed;
  }

  if (handoff) {
    return { action: "replace", path: failurePath };
  }

  return { action: "stay" };
};

const readImplicitSessionBody = (value: unknown): ImplicitSession | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Record<string, unknown>;
  const accessToken = tokenValue(
    typeof body.accessToken === "string" ? body.accessToken : null,
  );
  const refreshToken = tokenValue(
    typeof body.refreshToken === "string" ? body.refreshToken : null,
  );

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
};

const isSameOrigin = (origin: string | null, expected: string) => {
  return origin === expected && expected.length > 0;
};

export {
  implicitCallbackRewrite,
  implicitGrantPlan,
  isSameOrigin,
  parseImplicitGrant,
  readImplicitSessionBody,
};
export type { AuthLocation, ImplicitGrantPlan, ImplicitSession };
