"use client";

import { useEffect } from "react";

import { implicitGrantPlan } from "@/lib/auth/implicit-grant";

let pending: Promise<void> | null = null;

const consumeAuthHash = () => {
  if (pending) {
    return;
  }

  const plan = implicitGrantPlan(window.location);

  if (plan.action === "stay") {
    return;
  }

  pending = (async () => {
    let path = plan.action === "replace" ? plan.path : plan.failurePath;

    if (plan.action === "establish") {
      try {
        const response = await fetch("/auth/implicit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            accessToken: plan.accessToken,
            refreshToken: plan.refreshToken,
          }),
        });

        if (response.ok) {
          path = plan.successPath;
        }
      } catch {
        path = plan.failurePath;
      }
    }

    window.location.replace(path);
  })();
};

const AuthHashSession = () => {
  useEffect(() => {
    consumeAuthHash();
  }, []);

  return null;
};

export { AuthHashSession };
