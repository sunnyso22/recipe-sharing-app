import { createHash, randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { verification } from "@/db/schema";

const confirmationLifetimeMs = 10 * 60 * 1000;

const confirmIdentifier = (userId: string) => {
  return `confirm:${userId}`;
};

const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

const hasLiveConfirmation = async (userId: string) => {
  const rows = await db
    .select({ id: verification.id })
    .from(verification)
    .where(
      and(
        eq(verification.identifier, confirmIdentifier(userId)),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows.length > 0;
};

const saveConfirmation = async (userId: string, token: string) => {
  const identifier = confirmIdentifier(userId);
  const now = new Date();

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.insert(verification).values({
    id: randomUUID(),
    identifier,
    value: hashToken(token),
    expiresAt: new Date(now.getTime() + confirmationLifetimeMs),
    createdAt: now,
    updatedAt: now,
  });
};

const consumeConfirmation = async (userId: string, token: string) => {
  const deleted = await db
    .delete(verification)
    .where(
      and(
        eq(verification.identifier, confirmIdentifier(userId)),
        eq(verification.value, hashToken(token)),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .returning({ id: verification.id });

  return deleted.length > 0;
};

export { consumeConfirmation, hasLiveConfirmation, saveConfirmation };
