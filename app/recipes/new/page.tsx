import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { PageMain } from "@/components/page-main";
import {
  RecipeForm,
  RecipeFormSkeleton,
} from "@/components/recipes/recipe-form";
import { requireAuthUser } from "@/lib/auth/session";

export const metadata = {
  title: "Add recipe",
};

const NewRecipeForm = async () => {
  await requireAuthUser();

  return <RecipeForm />;
};

const NewRecipePage = () => {
  return (
    <PageMain>
      <BackLink href="/recipes" />
      <h1 className="font-heading text-4xl tracking-tight">Add a recipe</h1>
      <Suspense fallback={<RecipeFormSkeleton />}>
        <NewRecipeForm />
      </Suspense>
    </PageMain>
  );
};

export default NewRecipePage;
