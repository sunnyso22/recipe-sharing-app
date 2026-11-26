import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { user, verification } from "@/db/schema";

const resetIdentifier = (token: string) => {
  return `reset-password:${token}`;
};

const deleteReset = async (token: string) => {
  if (!token) {
    return;
  }

  await db
    .delete(verification)
    .where(eq(verification.identifier, resetIdentifier(token)));
};

const liveReset = async (token: string) => {
  if (!token) {
    return null;
  }

  const rows = await db
    .select({ email: user.email })
    .from(verification)
    .innerJoin(user, eq(user.id, verification.value))
    .where(
      and(
        eq(verification.identifier, resetIdentifier(token)),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
};

export { deleteReset, liveReset };
