import { ChefHat } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const SiteFooter = () => {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-8">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 font-heading text-lg tracking-tight">
            <ChefHat className="size-5 text-primary" aria-hidden />
            Cookery
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Discover, Share, and Savor the World&apos;s Best Recipes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <p className="text-sm text-muted-foreground">© 2026 Cookery</p>
        </div>
      </div>
    </footer>
  );
};

export { SiteFooter };
