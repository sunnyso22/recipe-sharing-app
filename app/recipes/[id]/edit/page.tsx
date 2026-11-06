import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import {
  RecipeForm,
  RecipeFormSkeleton,
} from "@/components/recipes/recipe-form";
import { buttonVariants } from "@/components/ui/button";
import { getRecipe, type RecipeDetails } from "@/db/queries/recipes";
import { type RecipeFormValues } from "@/lib/recipe-form";
import { parseRecipeId } from "@/lib/recipes";
import { cn } from "@/lib/utils";

import { updateRecipeAction } from "./actions";

export const generateMetadata = async ({
  params,
}: PageProps<"/recipes/[id]/edit">): Promise<Metadata> => {
  const { id } = await params;
  const recipeId = parseRecipeId(id);

  if (recipeId === null) {
    return { title: "Update recipe" };
  }

  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    return { title: "Update recipe" };
  }

  return { title: `Update ${recipe.title}` };
};

const toFormValues = (recipe: RecipeDetails): RecipeFormValues => {
  return {
    title: recipe.title,
    description: recipe.description,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map(({ name, quantity }) => ({ name, quantity }))
        : [{ name: "", quantity: "" }],
    seasonings:
      recipe.seasonings.length > 0
        ? recipe.seasonings.map(({ name, quantity }) => ({ name, quantity }))
        : [{ name: "", quantity: "" }],
    instructions:
      recipe.instructions.length > 0
        ? recipe.instructions.map(({ description }) => ({ description }))
        : [{ description: "" }],
  };
};

const EditRecipeBackLink = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]/edit">["params"];
}) => {
  const { id } = await params;

  return (
    <Link
      href={parseRecipeId(id) === null ? "/recipes" : `/recipes/${id}`}
      className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}
    >
      <ArrowLeft />
      Back
    </Link>
  );
};

const EditRecipeForm = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]/edit">["params"];
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
    <RecipeForm
      key={recipe.updatedAt.toISOString()}
      action={updateRecipeAction.bind(null, recipe.id)}
      defaultValues={toFormValues(recipe)}
      submitLabel="Update recipe"
      pendingLabel="Updating..."
    />
  );
};

const EditRecipePage = ({ params }: PageProps<"/recipes/[id]/edit">) => {
  return (
    <PageMain>
      <Suspense
        fallback={<div className="h-9 w-24 animate-pulse rounded-4xl bg-muted" />}
      >
        <EditRecipeBackLink params={params} />
      </Suspense>
      <h1 className="font-heading text-4xl tracking-tight">Update recipe</h1>
      <Suspense fallback={<RecipeFormSkeleton />}>
        <EditRecipeForm params={params} />
      </Suspense>
    </PageMain>
  );
};

export default EditRecipePage;
