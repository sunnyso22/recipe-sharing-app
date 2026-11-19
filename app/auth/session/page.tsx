import { PageMain } from "@/components/page-main";
import { Spinner } from "@/components/ui/spinner";

export const metadata = {
  title: "Confirming",
  robots: { index: false, follow: false },
};

const AuthSessionPage = () => {
  return (
    <PageMain className="items-center justify-center">
      <div role="status">
        <Spinner aria-hidden className="size-8" />
        <span className="sr-only">Confirming…</span>
      </div>
    </PageMain>
  );
};

export default AuthSessionPage;
