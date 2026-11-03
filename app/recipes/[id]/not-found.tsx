import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const RecipeNotFound = () => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-6 py-10">
      <h1 className="font-heading text-4xl tracking-tight">Recipe not found</h1>
      <p className="text-muted-foreground">
        That recipe is not in the collection.
      </p>
      <Link href="/recipes" className={buttonVariants()}>
        All recipes
      </Link>
    </main>
  );
};

export default RecipeNotFound;
