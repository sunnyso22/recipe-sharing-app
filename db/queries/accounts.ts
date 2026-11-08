import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { recipesTable } from "@/db/schema";

const deleteUserAccount = (userId: string) => {
  return db.transaction(async (tx) => {
    await tx.delete(recipesTable).where(eq(recipesTable.userId, userId));
    await tx.execute(
      sql`delete from auth.users where id = cast(${userId} as uuid)`,
    );
  });
};

export { deleteUserAccount };
