import Link from "next/link";

import { UserMenu } from "@/components/auth/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const SignInLink = () => {
  return (
    <Link href="/login" className={cn(buttonVariants(), "ml-1")}>
      Sign in
    </Link>
  );
};

const AuthNav = async () => {
  const user = await getAuthUser();

  if (!user) {
    return <SignInLink />;
  }

  return <UserMenu name={user.name} />;
};

export { AuthNav, SignInLink };
