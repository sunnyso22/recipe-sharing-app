import Link from "next/link";

import { RecipeCover } from "@/components/recipes/recipe-cover";
import { RecipeEngagement } from "@/components/recipes/recipe-engagement";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";

type RecipeCardProps = {
  id: number;
  title: string;
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  eager?: boolean;
};

const RecipeCard = ({
  id,
  title,
  likeCount,
  liked,
  bookmarked,
  eager = false,
}: RecipeCardProps) => {
  return (
    <Card className="relative h-full transition-shadow hover:shadow-lg">
      <RecipeCover
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        loading={eager ? "eager" : "lazy"}
      />
      <CardHeader className="items-center">
        <CardTitle className="text-xl">
          <h2>
            <Link
              href={`/recipes/${id}`}
              className="rounded-md outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {title}
            </Link>
          </h2>
        </CardTitle>
        <CardAction className="relative z-10 row-span-1 self-center">
          <RecipeEngagement
            compact
            recipeId={id}
            likeCount={likeCount}
            liked={liked}
            bookmarked={bookmarked}
          />
        </CardAction>
      </CardHeader>
    </Card>
  );
};

const RecipeCardSkeleton = () => {
  return (
    <Card className="pt-0">
      <div className="aspect-3/2 animate-pulse rounded-t-4xl bg-muted" />
      <CardHeader className="items-center">
        <div className="h-6 w-2/3 animate-pulse rounded-md bg-muted" />
        <CardAction className="flex gap-2 row-span-1 self-center">
          <div className="size-12 animate-pulse rounded-3xl bg-muted" />
          <div className="size-12 animate-pulse rounded-3xl bg-muted" />
        </CardAction>
      </CardHeader>
    </Card>
  );
};

export { RecipeCard, RecipeCardSkeleton };
