import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import { RecipeForm } from "@/components/recipes/recipe-form";
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
      <Suspense fallback={<RecipeFormFallback />}>
        <RecipeForm />
      </Suspense>
    </PageMain>
  );
};

const RecipeFormFallback = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="aspect-3/2 animate-pulse rounded-4xl bg-muted" />
        <div className="flex flex-col gap-4 lg:py-4">
          <div className="h-16 animate-pulse rounded-3xl bg-muted" />
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-4xl bg-muted" />
        <div className="h-56 animate-pulse rounded-4xl bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-4xl bg-muted" />
    </div>
  );
};

export default NewRecipePage;
