"use client";

import { AppearanceForm } from "@/components/settings/appearance-form";
import { DeleteAccount } from "@/components/settings/delete-account";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SettingsTabs = ({ name, email }: { name: string; email: string }) => {
  return (
    <Tabs defaultValue="profile" className="w-full max-w-xl">
      <TabsList className="w-full">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <ProfileForm name={name} email={email} />
      </TabsContent>
      <TabsContent value="appearance">
        <AppearanceForm />
      </TabsContent>
      <TabsContent value="password">
        <PasswordForm />
      </TabsContent>
      <TabsContent value="account">
        <DeleteAccount />
      </TabsContent>
    </Tabs>
  );
};

export { SettingsTabs };
