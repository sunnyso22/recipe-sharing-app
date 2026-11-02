import { ChefHat } from "lucide-react";

const SiteFooter = () => {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 font-heading text-lg tracking-tight">
            <ChefHat className="size-5 text-primary" aria-hidden />
            Cookery
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Discover, Share, and Savor the World&apos;s Best Recipes
          </p>
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">© 2026 Cookery</p>
      </div>
    </footer>
  );
};

export { SiteFooter };
