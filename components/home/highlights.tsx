import { Compass, Share2, UtensilsCrossed } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteName } from "@/lib/site";

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

const HomeHighlights = () => {
  return (
    <section
      id="highlights"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 pb-20"
    >
      <h2 className="font-heading text-3xl tracking-tight">
        Three ways to cook with {siteName}
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
  );
};

export { HomeHighlights };
