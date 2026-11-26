import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";

const handler = toNextJsHandler(auth);

const setCookieHeaders = (response: Response) => {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
};

const hasSessionCookie = (response: Response) => {
  return setCookieHeaders(response).some((cookie) => {
    const [pair, ...attributes] = cookie.split(";").map((part) => part.trim());
    const separator = pair.indexOf("=");

    if (separator < 0) {
      return false;
    }

    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    const cleared = attributes.some((attribute) => {
      return attribute.toLowerCase() === "max-age=0";
    });

    return name.includes("session_token") && value.length > 0 && !cleared;
  });
};

const signedInHome = (response: Response, origin: string) => {
  if (response.status < 300 || response.status >= 400) {
    return false;
  }

  const location = response.headers.get("location");

  if (!location) {
    return false;
  }

  const target = new URL(location, origin);

  return (
    target.pathname === "/" &&
    !target.searchParams.has("error") &&
    hasSessionCookie(response)
  );
};

const confirmationRequest = (request: Request) => {
  const url = new URL(request.url);

  if (!url.pathname.endsWith("/verify-email")) {
    return request;
  }

  // A confirmation always lands on the home page, including a callback
  // that did not start from a Cookery page.
  url.searchParams.set("callbackURL", "/");

  return new Request(url, {
    headers: request.headers,
    method: "GET",
  });
};

const GET = async (request: Request) => {
  const incoming = confirmationRequest(request);
  const response = await handler.GET(incoming);
  const url = new URL(incoming.url);

  if (!url.pathname.endsWith("/verify-email")) {
    return response;
  }

  if (signedInHome(response, url.origin)) {
    return response;
  }

  return Response.redirect(new URL("/login?error=confirm", url.origin), 302);
};

const POST = handler.POST;

export { GET, POST };
