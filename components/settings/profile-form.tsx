"use client";

import { useActionState } from "react";

import { updateNameAction } from "@/app/settings/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialSettingsFormState } from "@/lib/settings/form";

const ProfileForm = ({ name, email }: { name: string; email: string }) => {
  const [state, formAction, pending] = useActionState(
    updateNameAction,
    initialSettingsFormState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          <h2>Profile</h2>
        </CardTitle>
        <CardDescription>
          This is the display name on your Auth user. It appears next to your
          avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" defaultValue={email} readOnly disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-display-name">
                Display name
              </FieldLabel>
              <Input
                id="profile-display-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                defaultValue={state.values.name ?? name}
                required
                maxLength={80}
              />
            </Field>
          </FieldGroup>
          <FormMessage message={state.message} status={state.status} />
          <Button type="submit" className="w-fit" disabled={pending}>
            {pending ? "Saving..." : "Save display name"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { ProfileForm };
