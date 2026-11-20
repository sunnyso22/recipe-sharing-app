import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  recipeCountLabel,
  recipeListHref,
  type RecipeListPath,
  recipePageWindow,
} from "@/lib/recipes/pagination";
import { cn } from "@/lib/utils";

const stepClassName = (side: "previous" | "next") => {
  return cn(
    buttonVariants({ variant: "ghost", size: "default" }),
    side === "previous" ? "pl-2!" : "pr-2!",
  );
};

const RecipeStepLink = ({
  href,
  label,
  text,
  side,
}: {
  href: string | null;
  label: string;
  text: string;
  side: "previous" | "next";
}) => {
  const icon =
    side === "previous" ? (
      <ChevronLeftIcon data-icon="inline-start" />
    ) : (
      <ChevronRightIcon data-icon="inline-end" />
    );
  const caption = <span className="hidden sm:block">{text}</span>;

  if (!href) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="default"
        disabled
        aria-label={label}
        className={side === "previous" ? "pl-2!" : "pr-2!"}
      >
        {side === "previous" ? icon : null}
        {caption}
        {side === "next" ? icon : null}
      </Button>
    );
  }

  return (
    <Link href={href} aria-label={label} className={stepClassName(side)}>
      {side === "previous" ? icon : null}
      {caption}
      {side === "next" ? icon : null}
    </Link>
  );
};

const RecipePagination = ({
  pathname,
  query,
  page,
  totalPages,
}: {
  pathname: RecipeListPath;
  query: string;
  page: number;
  totalPages: number;
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const tokens = recipePageWindow(page, totalPages);

  return (
    <Pagination>
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <RecipeStepLink
            href={page > 1 ? recipeListHref(pathname, query, page - 1) : null}
            label="Go to previous page"
            text="Previous"
            side="previous"
          />
        </PaginationItem>
        {tokens.map((token, index) => {
          if (token === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const current = token === page;

          return (
            <PaginationItem key={token}>
              <Link
                href={recipeListHref(pathname, query, token)}
                aria-label={`Page ${token}`}
                aria-current={current ? "page" : undefined}
                data-slot="pagination-link"
                data-active={current ? true : undefined}
                className={cn(
                  buttonVariants({
                    variant: current ? "outline" : "ghost",
                    size: "icon",
                  }),
                  "tabular-nums",
                )}
              >
                {token}
              </Link>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <RecipeStepLink
            href={
              page < totalPages
                ? recipeListHref(pathname, query, page + 1)
                : null
            }
            label="Go to next page"
            text="Next"
            side="next"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

const RecipeSearchCount = ({
  query,
  total,
}: {
  query: string;
  total: number;
}) => {
  return (
    <p className="text-muted-foreground">
      {recipeCountLabel(total)} for “{query}”
    </p>
  );
};

const RecipePageNotice = ({
  pathname,
  query,
}: {
  pathname: RecipeListPath;
  query: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground">No recipes on this page.</p>
      <Link
        href={recipeListHref(pathname, query, 1)}
        className={buttonVariants({ variant: "outline" })}
      >
        First page
      </Link>
    </div>
  );
};

export { RecipePageNotice, RecipePagination, RecipeSearchCount };
