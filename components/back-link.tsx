import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BackLink = ({ href }: { href: string }) => {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 w-fit")}
    >
      <ArrowLeft />
      Back
    </Link>
  );
};

export { BackLink };
