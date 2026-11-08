import { AuthForm } from "@/components/auth/auth-form";
import { PageMain } from "@/components/page-main";

export const metadata = {
  title: "Sign up",
};

const SignupPage = () => {
  return (
    <PageMain className="items-center justify-center">
      <AuthForm mode="sign-up" />
    </PageMain>
  );
};

export default SignupPage;
