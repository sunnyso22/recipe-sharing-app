import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { recipesTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import Image from "next/image";
import { Suspense } from "react";

export const metadata = {
  title: "Recipes",
};

const recipePlaceholder = "/recipe-placeholder.jpg";

const RecipesPage = () => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <h1 className="font-heading text-4xl tracking-tight">Recipes</h1>
      <Suspense fallback={<RecipeGridSkeleton />}>
        <RecipeGrid />
      </Suspense>
    </main>
  );
};

export default RecipesPage;

const RecipeGrid = async () => {
  const recipes = await db
    .select({
      id: recipesTable.id,
      title: recipesTable.title,
    })
    .from(recipesTable)
    .orderBy(asc(recipesTable.createdAt));

  if (recipes.length === 0) {
    return <p className="text-muted-foreground">No recipes yet.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe, index) => (
        <li key={recipe.id}>
          <Card>
            <Image
              src={recipePlaceholder}
              alt=""
              width={1600}
              height={1066}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <CardHeader>
              <CardTitle className="text-xl">
                <h2>{recipe.title}</h2>
              </CardTitle>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
};

const RecipeGridSkeleton = () => {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index}>
          <Card className="pt-0">
            <div className="aspect-3/2 animate-pulse rounded-t-4xl bg-muted" />
            <CardHeader>
              <div className="h-6 w-2/3 animate-pulse rounded-md bg-muted" />
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
};
