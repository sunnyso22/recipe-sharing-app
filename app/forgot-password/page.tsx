import { Suspense } from "react";

import { AuthFormFallback } from "@/components/auth/auth-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PageMain } from "@/components/page-main";
import { expiredResetMessage } from "@/lib/auth/paths";

export const metadata = {
  title: "Reset password",
};

const ForgotPasswordRequest = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const notice = params.error === "expired" ? expiredResetMessage : undefined;

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
