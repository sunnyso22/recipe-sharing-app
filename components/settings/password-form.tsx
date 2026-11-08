"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/app/settings/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { passwordHint } from "@/lib/auth/form";
import { initialSettingsFormState } from "@/lib/settings/form";

const PasswordForm = () => {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialSettingsFormState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          <h2>Password</h2>
        </CardTitle>
        <CardDescription>
          Choose a new password for this account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="current-password">
                Current password
              </FieldLabel>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                defaultValue={state.values.currentPassword ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                defaultValue={state.values.password ?? ""}
              />
              <FieldDescription>{passwordHint}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-new-password">
                Confirm new password
              </FieldLabel>
              <Input
                id="confirm-new-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                defaultValue={state.values.confirmPassword ?? ""}
              />
            </Field>
          </FieldGroup>
          <FormMessage message={state.message} status={state.status} />
          <Button type="submit" className="w-fit" disabled={pending}>
            {pending ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { PasswordForm };
