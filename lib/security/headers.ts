type SecurityHeader = {
  key: string;
  value: string;
};

type SecurityHeaderOptions = {
  development?: boolean;
};

// The shell is prerendered (cacheComponents), so a per-request nonce cannot
// be stamped onto Next's inline RSC payload or the next-themes boot script.
// next-themes also injects a <style> tag when transitions are disabled, and
// next/image emits style="color:transparent". script-src-attr stays 'none'
// so inline event handlers are still blocked. Supabase Auth is called from
// the server; the browser only talks to this origin, including POST
// /auth/implicit.
const contentSecurityPolicy = ({
  development = false,
}: SecurityHeaderOptions = {}) => {
  const scriptSrc = ["'self'", "'unsafe-inline'"];

  if (development) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "worker-src 'self'",
  ];

  if (!development) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
};

const permissionsPolicy = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

const securityHeaders = ({
  development = false,
}: SecurityHeaderOptions = {}): SecurityHeader[] => {
  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy({ development }),
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Permitted-Cross-Domain-Policies",
      value: "none",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      key: "Permissions-Policy",
      value: permissionsPolicy,
    },
  ];

  if (!development) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000",
    });
  }

  return headers;
};

export { contentSecurityPolicy, securityHeaders };
export type { SecurityHeader, SecurityHeaderOptions };
