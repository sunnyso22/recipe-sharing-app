"use client";

import { useActionState } from "react";

import { updateRecoveredPasswordAction } from "@/app/reset-password/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type AuthFormState,
  initialAuthFormState,
  passwordHint,
} from "@/lib/auth/form";

const ResetPasswordForm = () => {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateRecoveredPasswordAction,
    initialAuthFormState,
  );
  const fieldMessage =
    state.fieldErrors.password ?? state.fieldErrors.confirmPassword;
  const message = fieldMessage ? "" : state.message;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="font-heading text-2xl tracking-tight">
          Choose a new password
        </h1>
        <CardDescription>
          This replaces the password on your Cookery account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <FieldGroup className="gap-4">
            <Field
              data-invalid={Boolean(state.fieldErrors.password) || undefined}
            >
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                defaultValue={state.values.password}
                aria-invalid={Boolean(state.fieldErrors.password) || undefined}
              />
              <FieldDescription>{passwordHint}</FieldDescription>
              <FieldError>{state.fieldErrors.password}</FieldError>
            </Field>
            <Field
              data-invalid={
                Boolean(state.fieldErrors.confirmPassword) || undefined
              }
            >
              <FieldLabel htmlFor="confirm-password">
                Confirm new password
              </FieldLabel>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                defaultValue={state.values.confirmPassword}
                aria-invalid={
                  Boolean(state.fieldErrors.confirmPassword) || undefined
                }
              />
              <FieldError>{state.fieldErrors.confirmPassword}</FieldError>
            </Field>
          </FieldGroup>
          <FormMessage message={message} status={state.status} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { ResetPasswordForm };
