import Image from "next/image";
import Link from "next/link";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { recipePlaceholder } from "@/lib/recipes";

type RecipeCardProps = {
  id: number;
  title: string;
  eager?: boolean;
};

const RecipeCard = ({ id, title, eager = false }: RecipeCardProps) => {
  return (
    <Link
      href={`/recipes/${id}`}
      className="block rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <Image
          src={recipePlaceholder}
          alt=""
          width={1600}
          height={1066}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-auto w-full"
          loading={eager ? "eager" : "lazy"}
        />
        <CardHeader>
          <CardTitle className="text-xl">
            <h2>{title}</h2>
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
};

const RecipeCardSkeleton = () => {
  return (
    <Card className="pt-0">
      <div className="aspect-3/2 animate-pulse rounded-t-4xl bg-muted" />
      <CardHeader>
        <div className="h-6 w-2/3 animate-pulse rounded-md bg-muted" />
      </CardHeader>
    </Card>
  );
};

export { RecipeCard, RecipeCardSkeleton };
