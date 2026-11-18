import { PageMain } from "@/components/page-main";
import {
  Card,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export const metadata = {
  title: "Confirming",
  robots: { index: false, follow: false },
};

const AuthSessionPage = () => {
  return (
    <PageMain className="items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="font-heading text-2xl tracking-tight">
            Confirming your account
          </h1>
          <CardDescription role="status">
            This takes a moment. You will continue to sign in once the link
            has been checked.
          </CardDescription>
        </CardHeader>
      </Card>
    </PageMain>
  );
};

export default AuthSessionPage;
