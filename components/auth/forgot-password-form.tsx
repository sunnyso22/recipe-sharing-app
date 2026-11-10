"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/forgot-password/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type AuthFormState,
  initialAuthFormState,
} from "@/lib/auth/form";

const ForgotPasswordForm = ({ notice }: { notice?: string }) => {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    initialAuthFormState,
  );
  const message =
    state.status === "idle"
      ? (notice ?? "")
      : state.fieldErrors.email
        ? ""
        : state.message;
  const status = state.status === "idle" && notice ? "error" : state.status;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="font-heading text-2xl tracking-tight">
          Reset your password
        </h1>
        <CardDescription>
          Enter the email on your account and we will send a link to choose a
          new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(state.fieldErrors.email) || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                spellCheck={false}
                required
                defaultValue={state.values.email}
                aria-invalid={Boolean(state.fieldErrors.email) || undefined}
              />
              <FieldError>{state.fieldErrors.email}</FieldError>
            </Field>
          </FieldGroup>
          <FormMessage message={message} status={status} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t text-sm text-muted-foreground">
        <p>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export { ForgotPasswordForm };
