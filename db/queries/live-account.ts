import { sql } from "drizzle-orm";

import { db } from "@/db";
import { type LiveAccount } from "@/lib/auth/live-session";

const liveFlag = (value: unknown) => {
  return value === true;
};

// Same database deleteUserAccount writes. A leftover JWT is not consulted.
const liveAuthAccount = async (ids: {
  userId: string;
  sessionId: string;
}): Promise<LiveAccount> => {
  const rows = await db.execute<{
    account_exists: boolean;
    session_exists: boolean;
  }>(sql`
    select
      exists (
        select 1 from auth.users where id = cast(${ids.userId} as uuid)
      ) as account_exists,
      exists (
        select 1
        from auth.sessions
        where id = cast(${ids.sessionId} as uuid)
          and user_id = cast(${ids.userId} as uuid)
      ) as session_exists
  `);
  const row = rows[0];

  if (!row) {
    throw new Error("Live account check returned no row.");
  }

  return {
    accountExists: liveFlag(row.account_exists),
    sessionExists: liveFlag(row.session_exists),
  };
};

export { liveAuthAccount };
