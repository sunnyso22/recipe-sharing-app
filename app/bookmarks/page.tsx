import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import {
  RecipeGrid,
  RecipeGridSkeleton,
} from "@/components/recipes/recipe-grid";
import {
  RecipeSearchForm,
  RecipeSearchFormFallback,
} from "@/components/recipes/recipe-search";
import { requireAuthUser } from "@/lib/auth/session";

export const metadata = {
  title: "Bookmarks",
};

const BookmarkList = async ({
  searchParams,
}: {
  searchParams: PageProps<"/bookmarks">["searchParams"];
}) => {
  const user = await requireAuthUser();

  return (
    <RecipeGrid
      searchParams={searchParams}
      userId={user.id}
      source="bookmarked"
      emptyMessage="You have not bookmarked a recipe yet. Save one from its page and it will show up here."
    />
  );
};

const BookmarksPage = ({ searchParams }: PageProps<"/bookmarks">) => {
  return (
    <PageMain>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground">
            Recipes you have saved to come back to.
          </p>
        </div>
        <Suspense fallback={<RecipeSearchFormFallback />}>
          <RecipeSearchForm />
        </Suspense>
      </div>
      <Suspense fallback={<RecipeGridSkeleton />}>
        <BookmarkList searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export default BookmarksPage;
