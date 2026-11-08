import type { Metadata } from "next";
import Link from "next/link";

import { PageMain } from "@/components/page-main";
import { buttonVariants } from "@/components/ui/button";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
};

const NotFound = () => {
  return (
    <PageMain className="items-start gap-4">
      <h1 className="font-heading text-4xl tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        That page is not part of {siteName}.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back home
      </Link>
    </PageMain>
  );
};

export default NotFound;
