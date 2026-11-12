import { type ReactNode, Suspense } from "react";

import { PageMain } from "@/components/page-main";
import { RecipeGridSkeleton } from "@/components/recipes/recipe-grid";
import {
  RecipeSearchForm,
  RecipeSearchFormFallback,
} from "@/components/recipes/recipe-search";

const RecipeCatalog = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <PageMain>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={<RecipeSearchFormFallback />}>
            <RecipeSearchForm />
          </Suspense>
          {action}
        </div>
      </div>
      <Suspense fallback={<RecipeGridSkeleton />}>{children}</Suspense>
    </PageMain>
  );
};

export { RecipeCatalog };
