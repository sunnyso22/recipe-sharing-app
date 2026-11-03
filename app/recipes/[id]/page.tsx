import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { cn } from "@/lib/utils";

const recipePlaceholder = "/recipe-placeholder.jpg";

const parseRecipeId = (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  const recipeId = Number(id);

  if (!Number.isSafeInteger(recipeId)) {
    return null;
  }

  return recipeId;
};

const getRecipe = cache((recipeId: number) => {
  return db.query.recipesTable.findFirst({
    where: { id: recipeId },
    with: {
      ingredients: {
        orderBy: { id: "asc" },
      },
      seasonings: {
        orderBy: { id: "asc" },
      },
      instructions: {
        orderBy: { stepNumber: "asc" },
      },
    },
  });
});

export const generateMetadata = async ({
  params,
}: PageProps<"/recipes/[id]">): Promise<Metadata> => {
  const { id } = await params;
  const recipeId = parseRecipeId(id);

  if (recipeId === null) {
    return { title: "Recipe" };
  }

  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    return { title: "Recipe" };
  }

  return {
    title: recipe.title,
    description: recipe.description,
  };
};

const RecipePage = ({ params }: PageProps<"/recipes/[id]">) => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <Link
        href="/recipes"
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}
      >
        All recipes
      </Link>
      <Suspense fallback={<RecipeDetailSkeleton />}>
        <RecipeDetail params={params} />
      </Suspense>
    </main>
  );
};

export default RecipePage;

const RecipeDetail = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]">["params"];
}) => {
  const { id } = await params;
  const recipeId = parseRecipeId(id);

  if (recipeId === null) {
    notFound();
  }

  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <article className="flex flex-col gap-10">
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-0">
          <Image
            src={recipePlaceholder}
            alt=""
            width={1600}
            height={1066}
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="block h-auto w-full"
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
        <RecipeList
          title="Ingredients"
          items={recipe.ingredients}
          emptyLabel="No ingredients listed."
        />
        <RecipeList
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

const RecipeList = ({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: { id: number; name: string; quantity: string }[];
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
