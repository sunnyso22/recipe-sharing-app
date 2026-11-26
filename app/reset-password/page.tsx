import Link from "next/link";
import { Suspense } from "react";

import { AuthFormFallback } from "@/components/auth/auth-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PageMain } from "@/components/page-main";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { expiredResetMessage } from "@/lib/auth/paths";
import { liveReset } from "@/lib/auth/reset-record";

export const metadata = {
  title: "Choose a new password",
};

const ResetLinkExpired = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="font-heading text-2xl tracking-tight">
          Reset link expired
        </h1>
        <CardDescription>{expiredResetMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/forgot-password"
          className={buttonVariants({ className: "w-full" })}
        >
          Request a new link
        </Link>
      </CardContent>
      <CardFooter className="justify-center border-t text-sm text-muted-foreground">
        <p>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

const ResetPasswordRequest = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const live = await liveReset(token);

  if (!live) {
    return <ResetLinkExpired />;
  }

  return <ResetPasswordForm token={token} />;
};

const ResetPasswordPage = ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  return (
    <PageMain className="items-center justify-center">
      <Suspense fallback={<AuthFormFallback />}>
        <ResetPasswordRequest searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export { ResetPasswordRequest };
export default ResetPasswordPage;
