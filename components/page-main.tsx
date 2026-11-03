import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const PageMain = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10",
        className,
      )}
    >
      {children}
    </main>
  );
};

export { PageMain };
