import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RecipeCover } from "@/components/recipes/recipe-cover";
import {
  RecipeEngagement,
  RecipeEngagementFallback,
} from "@/components/recipes/recipe-engagement";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecipeAuthorName } from "@/db/queries/accounts";
import { getRecipeEngagement } from "@/db/queries/engagement";
import { getRecipeByParam, type RecipeDetails } from "@/db/queries/recipes";
import { getAuthUser } from "@/lib/auth/session";
import { initialsFromName } from "@/lib/names";

const RecipeEngagementLoader = async ({ recipeId }: { recipeId: number }) => {
  const user = await getAuthUser();
  const engagement = await getRecipeEngagement(recipeId, user?.id);

  return (
    <RecipeEngagement
      recipeId={recipeId}
      likeCount={engagement.likeCount}
      liked={engagement.liked}
      bookmarked={engagement.bookmarked}
    />
  );
};

const RecipeDetail = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]">["params"];
}) => {
  const { id } = await params;
  const recipe = await getRecipeByParam(id);

  if (!recipe) {
    notFound();
  }

  const authorName = await getRecipeAuthorName(recipe.userId);

  return (
    <article className="flex flex-col gap-10">
      <div className="grid items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-0">
          <RecipeCover
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="block"
          />
        </Card>
        <header className="flex h-full flex-col gap-4 lg:py-4">
          <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
            {recipe.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2 pe-8">
              <Avatar aria-hidden>
                <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                  {initialsFromName(authorName)}
                </AvatarFallback>
              </Avatar>
              <p className="min-w-0 truncate text-sm">{authorName}</p>
            </div>
            <Suspense fallback={<RecipeEngagementFallback />}>
              <RecipeEngagementLoader recipeId={recipe.id} />
            </Suspense>
          </div>
        </header>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecipeQuantityList
          title="Ingredients"
          items={recipe.ingredients}
          emptyLabel="No ingredients listed."
        />
        <RecipeQuantityList
          title="Seasonings"
          items={recipe.seasonings}
          emptyLabel="No seasonings listed."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            <h2>Instructions</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recipe.instructions.length === 0 ? (
            <p className="text-muted-foreground">No instructions listed.</p>
          ) : (
            <ol className="flex flex-col gap-5">
              {recipe.instructions.map((instruction) => (
                <li key={instruction.id} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    {instruction.stepNumber}
                  </span>
                  <p className="pt-1 leading-relaxed">
                    {instruction.description}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </article>
  );
};

const RecipeQuantityList = ({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: RecipeDetails["ingredients"];
  emptyLabel: string;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0"
              >
                <span>{item.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const RecipeDetailSkeleton = () => {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="aspect-3/2 animate-pulse rounded-4xl bg-muted" />
        <div className="flex h-full flex-col gap-4 lg:py-4">
          <div className="h-12 w-4/5 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-2/3 animate-pulse rounded-md bg-muted" />
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex items-center gap-4">
              <div className="size-9 animate-pulse rounded-full bg-muted" />
              <div className="size-9 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-4xl bg-muted" />
        <div className="h-48 animate-pulse rounded-4xl bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-4xl bg-muted" />
    </div>
  );
};

export { RecipeDetail, RecipeDetailSkeleton };
