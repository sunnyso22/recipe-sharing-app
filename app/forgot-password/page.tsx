import { Suspense } from "react";

import { AuthFormFallback } from "@/components/auth/auth-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PageMain } from "@/components/page-main";

export const metadata = {
  title: "Reset password",
};

const expiredMessage =
  "That reset link is invalid or has expired. Request a new one.";

const ForgotPasswordRequest = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const notice = params.error === "expired" ? expiredMessage : undefined;

  return <ForgotPasswordForm notice={notice} />;
};

const ForgotPasswordPage = ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  return (
    <PageMain className="items-center justify-center">
      <Suspense fallback={<AuthFormFallback />}>
        <ForgotPasswordRequest searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
};

export default ForgotPasswordPage;
