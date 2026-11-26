import { headers } from "next/headers";

const productionOrigin = "https://cookery.sunnyso22.dev";

const localhostHost = (host: string) => {
  return (
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host === "127.0.0.1" ||
    host.startsWith("127.0.0.1:")
  );
};

const headerHost = async (request?: Request) => {
  const fromRequest = request?.headers.get("host")?.split(",")[0]?.trim();

  if (fromRequest) {
    return fromRequest;
  }

  const headerStore = await headers();
  return headerStore.get("host")?.split(",")[0]?.trim() ?? "";
};

// The link opens the same Cookery environment that created the user.
const confirmationOrigin = async (request?: Request) => {
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "production") {
    return productionOrigin;
  }

  if (vercelEnv === "preview") {
    const host = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");

    if (!host) {
      throw new Error("Preview URL is missing.");
    }

    return `https://${host}`;
  }

  const host = await headerHost(request);

  if (localhostHost(host)) {
    return `http://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    return productionOrigin;
  }

  throw new Error("Cookery could not choose a confirmation link.");
};

const confirmationUrl = async (token: string, request?: Request) => {
  const url = new URL("/api/auth/verify-email", await confirmationOrigin(request));
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", "/");
  return url.toString();
};

export { confirmationOrigin, confirmationUrl, productionOrigin };
