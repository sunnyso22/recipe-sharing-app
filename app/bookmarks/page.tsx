import { RecipeCatalog } from "@/components/recipes/recipe-catalog";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
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
    <RecipeCatalog
      title="Bookmarks"
      description="Recipes you have saved to come back to."
    >
      <BookmarkList searchParams={searchParams} />
    </RecipeCatalog>
  );
};

export default BookmarksPage;
