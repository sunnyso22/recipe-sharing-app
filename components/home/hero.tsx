import Link from "next/link";

import { RecipeCover } from "@/components/recipes/recipe-cover";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteDescription } from "@/lib/site";

const HomeHero = () => {
  return (
    <section>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div className="flex flex-col items-start gap-6">
          <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {siteDescription}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
            Your Culinary Adventure Starts Here!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/recipes" className={buttonVariants({ size: "lg" })}>
              Explore recipes
            </Link>
            <Link
              href="#highlights"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See how it works
            </Link>
          </div>
        </div>
        <Card className="pt-0">
          <RecipeCover
            alt="A plated dish from the Cookery collection"
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <CardHeader>
            <CardTitle className="text-lg">Tonight&apos;s table</CardTitle>
            <CardDescription>
              A place for the recipes worth cooking again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
};

export { HomeHero };
