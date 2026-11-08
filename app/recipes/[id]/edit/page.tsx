import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { PageMain } from "@/components/page-main";
import {
  RecipeForm,
  RecipeFormSkeleton,
} from "@/components/recipes/recipe-form";
import { getRecipeByParam, type RecipeDetails } from "@/db/queries/recipes";
import { parseRecipeId } from "@/lib/recipes";
import { getManageableRecipe } from "@/lib/recipes/access";
import {
  emptyInstruction,
  emptyQuantity,
  type RecipeFormValues,
} from "@/lib/recipes/form";

import { updateRecipeAction } from "./actions";

export const generateMetadata = async ({
  params,
}: PageProps<"/recipes/[id]/edit">): Promise<Metadata> => {
  const { id } = await params;
  const recipe = await getRecipeByParam(id);

  if (!recipe) {
    return { title: "Update recipe" };
  }

  return { title: `Update ${recipe.title}` };
};

const quantityValues = (rows: { name: string; quantity: string }[]) => {
  if (rows.length === 0) {
    return [emptyQuantity()];
  }

  return rows.map(({ name, quantity }) => ({ name, quantity }));
};

const toFormValues = (recipe: RecipeDetails): RecipeFormValues => {
  return {
    title: recipe.title,
    description: recipe.description,
    ingredients: quantityValues(recipe.ingredients),
    seasonings: quantityValues(recipe.seasonings),
    instructions:
      recipe.instructions.length > 0
        ? recipe.instructions.map(({ description }) => ({ description }))
        : [emptyInstruction()],
  };
};

const EditRecipeBackLink = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]/edit">["params"];
}) => {
  const { id } = await params;

  return (
    <BackLink href={parseRecipeId(id) === null ? "/recipes" : `/recipes/${id}`} />
  );
};

const EditRecipeForm = async ({
  params,
}: {
  params: PageProps<"/recipes/[id]/edit">["params"];
}) => {
  const { id } = await params;
  const recipe = await getManageableRecipe(id);

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
