import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Compass, Share2, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const highlights = [
  {
    title: "Discover",
    description: "Find dishes from home kitchens and far-off tables.",
    icon: Compass,
  },
  {
    title: "Share",
    description: "Pass along the recipes you actually cook and love.",
    icon: Share2,
  },
  {
    title: "Savor",
    description: "Cook something new, then come back for the next bite.",
    icon: UtensilsCrossed,
  },
] as const;

const Home = () => {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Discover, Share, and Savor the World&apos;s Best Recipes
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Your Culinary Adventure Starts Here!
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/recipes"
                className={buttonVariants({ size: "lg" })}
              >
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
            <Image
              src="/recipe-placeholder.jpg"
              alt="A plated dish from the Cookery collection"
              width={1600}
              height={1066}
              priority
              className="h-auto w-full"
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

      <section
        id="highlights"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 pb-20"
      >
        <h2 className="font-heading text-3xl tracking-tight">
          Three ways to cook with Cookery
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <li key={highlight.title}>
                <Card className="h-full">
                  <CardHeader>
                    <Icon className="size-5 text-primary" aria-hidden />
                    <CardTitle className="text-xl">{highlight.title}</CardTitle>
                    <CardDescription>{highlight.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
};

export default Home;
