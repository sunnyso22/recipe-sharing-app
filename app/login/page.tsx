import { Suspense } from "react";

import { AuthForm, AuthFormFallback } from "@/components/auth/auth-form";
import { PageMain } from "@/components/page-main";
import { safeNextPath } from "@/lib/auth/paths";

export const metadata = {
  title: "Sign in",
};

const confirmMessage =
  "That confirmation link is invalid or expired. Try signing in, or create the account again.";

const LoginForm = async ({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) => {
  const params = await searchParams;
  const notice = params.error === "confirm" ? confirmMessage : undefined;
  const redirectTo =
    typeof params.next === "string" ? safeNextPath(params.next) : undefined;

  return <AuthForm mode="sign-in" notice={notice} redirectTo={redirectTo} />;
};

const LoginPage = ({ searchParams }: PageProps<"/login">) => {
  return (
    <PageMain className="items-center justify-center">
      <Suspense fallback={<AuthFormFallback />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export default LoginPage;
