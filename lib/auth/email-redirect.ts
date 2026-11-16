import { authCallbackPath } from "@/lib/auth/paths";

const configuredOrigin = (siteUrl: string | null | undefined) => {
  const raw = siteUrl?.trim();

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
};

const localDevOrigin = (
  nodeEnv: string | undefined,
  hostHeader: string | null | undefined,
) => {
  if (nodeEnv === "production") {
    return null;
  }

  const host = hostHeader?.split(",")[0]?.trim() ?? "";

  if (
    host !== "localhost" &&
    !host.startsWith("localhost:") &&
    host !== "127.0.0.1" &&
    !host.startsWith("127.0.0.1:")
  ) {
    return null;
  }

  try {
    const url = new URL(`http://${host}`);

    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
};

// Production and preview deploys must use NEXT_PUBLIC_SITE_URL. The Host
// header on a preview deploy changes, so it is not a confirmation redirect.
const confirmationRedirectUrl = ({
  siteUrl,
  nodeEnv,
  host,
}: {
  siteUrl: string | null | undefined;
  nodeEnv: string | undefined;
  host: string | null | undefined;
}) => {
  const origin = configuredOrigin(siteUrl) ?? localDevOrigin(nodeEnv, host);

  if (!origin) {
    return null;
  }

  return `${origin}${authCallbackPath}`;
};

export { confirmationRedirectUrl };
