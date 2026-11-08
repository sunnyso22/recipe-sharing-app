import Image from "next/image";

import { recipePlaceholder } from "@/lib/recipes";
import { cn } from "@/lib/utils";

const RecipeCover = ({
  alt = "",
  sizes,
  priority = false,
  loading,
  className,
}: {
  alt?: string;
  sizes: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  className?: string;
}) => {
  return (
    <Image
      src={recipePlaceholder}
      alt={alt}
      width={1600}
      height={1066}
      sizes={sizes}
      className={cn("h-auto w-full", className)}
      {...(priority ? { priority: true } : {})}
      {...(loading ? { loading } : {})}
    />
  );
};

export { RecipeCover };
