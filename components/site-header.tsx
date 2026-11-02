import { Button, buttonVariants } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/recipes", label: "Recipes" },
] as const;

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-xl tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ChefHat className="size-5" aria-hidden />
          </span>
          Cookery
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "ghost" })}
            >
              {item.label}
            </Link>
          ))}
          <Button type="button" className="ml-1">
            Sign in
          </Button>
        </nav>
      </div>
    </header>
  );
};

export { SiteHeader };
