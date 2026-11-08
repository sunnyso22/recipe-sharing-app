import { notFound } from "next/navigation";

import { RecipeCover } from "@/components/recipes/recipe-cover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecipeByParam, type RecipeDetails } from "@/db/queries/recipes";

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

  return (
    <article className="flex flex-col gap-10">
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-0">
          <RecipeCover
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="block"
          />
        </Card>
        <header className="flex flex-col gap-4 lg:py-4">
          <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
            {recipe.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
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
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="aspect-3/2 animate-pulse rounded-4xl bg-muted" />
        <div className="flex flex-col gap-4 lg:py-4">
          <div className="h-12 w-4/5 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-2/3 animate-pulse rounded-md bg-muted" />
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
