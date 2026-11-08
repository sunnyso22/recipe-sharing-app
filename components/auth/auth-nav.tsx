import Link from "next/link";

import { signOutAction } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { getAuthEmail } from "@/lib/auth";
import { cn } from "@/lib/utils";

const SignInLink = () => {
  return (
    <Link href="/login" className={cn(buttonVariants(), "ml-1")}>
      Sign in
    </Link>
  );
};

const AuthNav = async () => {
  const email = await getAuthEmail();

  if (!email) {
    return <SignInLink />;
  }

  return (
    <div className="ml-1 flex items-center gap-2">
      <span
        className="hidden max-w-44 truncate text-sm text-muted-foreground md:inline"
        title={email}
      >
        {email}
      </span>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
};

export { AuthNav, SignInLink };
