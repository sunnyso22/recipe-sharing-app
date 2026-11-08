import { Suspense } from "react";

import { PageMain } from "@/components/page-main";
import { SettingsTabs } from "@/components/settings/account-settings";
import { requireAuthUser } from "@/lib/auth/session";

export const metadata = {
  title: "Settings",
};

const SettingsForms = async () => {
  const user = await requireAuthUser();

  return <SettingsTabs name={user.name} email={user.email} />;
};

const SettingsFallback = () => {
  return (
    <div className="flex w-full max-w-xl flex-col gap-2" aria-hidden>
      <div className="h-9 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-64 animate-pulse rounded-4xl bg-muted" />
    </div>
  );
};

const SettingsPage = () => {
  return (
    <PageMain>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-4xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Update your display name, appearance, password, or delete your
          account.
        </p>
      </div>
      <Suspense fallback={<SettingsFallback />}>
        <SettingsForms />
      </Suspense>
    </PageMain>
  );
};

export default SettingsPage;
