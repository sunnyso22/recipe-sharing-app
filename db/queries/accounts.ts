import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  recipeBookmarksTable,
  recipeLikesTable,
  recipesTable,
} from "@/db/schema";
import { readDisplayName } from "@/lib/auth/session";

const unknownAuthor = "Unknown";

const getRecipeAuthorName = async (userId: string | null) => {
  if (!userId) {
    return unknownAuthor;
  }

  const rows = await db.execute<{ name: string | null; email: string | null }>(
    sql`select raw_user_meta_data ->> 'name' as name, email from auth.users where id = cast(${userId} as uuid) limit 1`,
  );
  const author = rows[0];

  if (!author) {
    return unknownAuthor;
  }

  const name = readDisplayName(
    { name: author.name },
    typeof author.email === "string" ? author.email : "",
  );

  return name.length > 0 ? name : unknownAuthor;
};

const deleteUserAccount = (userId: string) => {
  return db.transaction(async (tx) => {
    await tx
      .delete(recipeLikesTable)
      .where(eq(recipeLikesTable.userId, userId));
    await tx
      .delete(recipeBookmarksTable)
      .where(eq(recipeBookmarksTable.userId, userId));
    await tx.delete(recipesTable).where(eq(recipesTable.userId, userId));
    await tx.execute(
      sql`delete from auth.users where id = cast(${userId} as uuid)`,
    );
  });
};

export { deleteUserAccount, getRecipeAuthorName };
