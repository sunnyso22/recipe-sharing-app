import Link from "next/link";

import { PageMain } from "@/components/page-main";
import { buttonVariants } from "@/components/ui/button";

const RecipeNotFound = () => {
  return (
    <PageMain className="items-start gap-4">
      <h1 className="font-heading text-4xl tracking-tight">Recipe not found</h1>
      <p className="text-muted-foreground">
        That recipe is not in the collection.
      </p>
      <Link href="/recipes" className={buttonVariants()}>
        All recipes
      </Link>
    </PageMain>
  );
};

export default RecipeNotFound;
