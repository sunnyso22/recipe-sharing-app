import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import {
  RecipeForm,
  RecipeFormSkeleton,
} from "@/components/recipes/recipe-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Add recipe",
};

const NewRecipePage = () => {
  return (
    <PageMain>
      <Link
        href="/recipes"
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}
      >
        <ArrowLeft />
        Back
      </Link>
      <h1 className="font-heading text-4xl tracking-tight">Add a recipe</h1>
      <Suspense fallback={<RecipeFormSkeleton />}>
        <RecipeForm />
      </Suspense>
    </PageMain>
  );
};

export default NewRecipePage;
