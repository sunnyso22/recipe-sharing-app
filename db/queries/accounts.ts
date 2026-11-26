import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

const unknownAuthor = "Unknown";

const getRecipeAuthorName = async (userId: string | null) => {
  if (!userId) {
    return unknownAuthor;
  }

  const [author] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const name = author?.name.trim() ?? "";
  return name.length > 0 ? name : unknownAuthor;
};

export { getRecipeAuthorName };
