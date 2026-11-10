"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, signUpAction } from "@/app/login/actions";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AuthFormState,
  initialAuthFormState,
  passwordHint,
} from "@/lib/auth/form";
import { forgotPasswordPath } from "@/lib/auth/paths";

const AuthForm = ({
  mode,
  notice,
  redirectTo,
}: {
  mode: "sign-in" | "sign-up";
  notice?: string;
  redirectTo?: string;
}) => {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    initialAuthFormState,
  );
  const fieldMessage =
    state.fieldErrors.name ??
    state.fieldErrors.email ??
    state.fieldErrors.password ??
    state.fieldErrors.confirmPassword;
  const message =
    state.status === "idle"
      ? (notice ?? "")
      : fieldMessage
        ? ""
        : state.message;
  const status = state.status === "idle" && notice ? "error" : state.status;
  const signingIn = mode === "sign-in";
  const tab = signingIn ? "sign-in" : "sign-up";

  return (
    <Tabs value={tab} className="w-full max-w-md">
      <TabsList>
        <TabsTrigger
          value="sign-in"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Sign in
        </TabsTrigger>
        <TabsTrigger
          value="sign-up"
          nativeButton={false}
          render={<Link href="/signup" />}
        >
          Sign up
        </TabsTrigger>
      </TabsList>
      <TabsContent value={tab}>
        <Card className="w-full">
          <CardHeader>
            <h1 className="font-heading text-2xl tracking-tight">
              {signingIn ? "Welcome back" : "Create an account"}
            </h1>
            <CardDescription>
              {signingIn
                ? "Sign in with the email and password on your Cookery account."
                : "Create an account to keep your recipes under your name."}
            </CardDescription>
          </CardHeader>
          <CardContent>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          {redirectTo ? (
            <input type="hidden" name="next" value={redirectTo} />
          ) : null}
          <FieldGroup className="gap-4">
            {signingIn ? null : (
              <Field data-invalid={Boolean(state.fieldErrors.name) || undefined}>
                <FieldLabel htmlFor="name">Display name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  required
                  maxLength={80}
                  defaultValue={state.values.name}
                  aria-invalid={Boolean(state.fieldErrors.name) || undefined}
                />
                <FieldError>{state.fieldErrors.name}</FieldError>
              </Field>
            )}
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
            <Field
              data-invalid={Boolean(state.fieldErrors.password) || undefined}
            >
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                {signingIn ? (
                  <Link
                    href={forgotPasswordPath}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={signingIn ? "current-password" : "new-password"}
                required
                minLength={signingIn ? undefined : 8}
                defaultValue={state.values.password}
                aria-invalid={Boolean(state.fieldErrors.password) || undefined}
              />
              {signingIn ? null : (
                <FieldDescription>{passwordHint}</FieldDescription>
              )}
              <FieldError>{state.fieldErrors.password}</FieldError>
            </Field>
            {signingIn ? null : (
              <Field
                data-invalid={
                  Boolean(state.fieldErrors.confirmPassword) || undefined
                }
              >
                <FieldLabel htmlFor="confirm-password">
                  Confirm password
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
            )}
          </FieldGroup>
          <FormMessage message={message} status={status} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? signingIn
                ? "Signing in..."
                : "Creating account..."
              : signingIn
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
          </CardContent>
          <CardFooter className="justify-center border-t text-sm text-muted-foreground">
            {signingIn ? (
              <p>
                New to Cookery?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

const AuthFormFallback = () => {
  return (
    <div className="flex w-full max-w-md flex-col gap-2" aria-hidden>
      <div className="h-9 w-44 animate-pulse rounded-full bg-muted" />
      <Card className="w-full">
      <CardHeader>
        <div className="h-7 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-muted" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-9 animate-pulse rounded-3xl bg-muted" />
        <div className="h-9 animate-pulse rounded-3xl bg-muted" />
        <div className="h-9 animate-pulse rounded-full bg-muted" />
      </CardContent>
      </Card>
    </div>
  );
};

export { AuthForm, AuthFormFallback };
