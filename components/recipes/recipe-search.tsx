"use client";

import { RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SubmitEvent, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const searchInputClassName =
  "h-9 w-40 border-border bg-card sm:w-48 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden";

const RecipeSearchForm = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }

    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch.flush();
  };

  const handleReset = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    handleSearch("");
    handleSearch.flush();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor="recipe-search" className="sr-only">
        Search recipes
      </label>
      <Input
        ref={inputRef}
        id="recipe-search"
        name="q"
        type="search"
        placeholder="Search"
        onChange={(event) => {
          handleSearch(event.target.value);
        }}
        defaultValue={searchParams.get("q")?.toString()}
        autoComplete="off"
        maxLength={100}
        className={searchInputClassName}
      />
      <Button
        type="button"
        size="icon"
        onClick={handleReset}
        aria-label="Show all recipes"
      >
        <RotateCcw />
      </Button>
    </form>
  );
};

const RecipeSearchFormFallback = () => {
  return (
    <form className="flex items-center gap-2">
      <label htmlFor="recipe-search" className="sr-only">
        Search recipes
      </label>
      <Input
        id="recipe-search"
        name="q"
        type="search"
        placeholder="Search"
        autoComplete="off"
        maxLength={100}
        className={searchInputClassName}
      />
      <Button type="button" size="icon" disabled aria-label="Show all recipes">
        <RotateCcw />
      </Button>
    </form>
  );
};

export { RecipeSearchForm, RecipeSearchFormFallback };
