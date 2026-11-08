import { ChefHat } from "lucide-react";

import { siteDescription, siteName } from "@/lib/site";

const SiteFooter = () => {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-8">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 font-heading text-lg tracking-tight">
            <ChefHat className="size-5 text-primary" aria-hidden />
            {siteName}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {siteDescription}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 {siteName}</p>
      </div>
    </footer>
  );
};

export { SiteFooter };
