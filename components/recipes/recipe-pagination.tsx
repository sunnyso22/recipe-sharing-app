import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  recipeCountLabel,
  recipeListHref,
  type RecipeListPath,
} from "@/lib/recipes/pagination";
import { cn } from "@/lib/utils";

const pageLinkClassName = (side: "previous" | "next") => {
  return cn(
    buttonVariants({ variant: "ghost" }),
    side === "previous" ? "pl-2!" : "pr-2!",
  );
};

const RecipePageLink = ({
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
    <Link href={href} aria-label={label} className={pageLinkClassName(side)}>
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

  return (
    <Pagination>
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          <RecipePageLink
            href={page > 1 ? recipeListHref(pathname, query, page - 1) : null}
            label="Go to previous page"
            text="Previous"
            side="previous"
          />
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <RecipePageLink
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
