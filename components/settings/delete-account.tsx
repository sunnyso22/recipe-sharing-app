"use client";

import type { AlertDialogRootActions } from "@base-ui/react/alert-dialog";
import { Trash2 } from "lucide-react";
import { useActionState, useRef } from "react";

import { deleteAccountAction } from "@/app/settings/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialSettingsFormState } from "@/lib/settings/form";

const DeleteAccount = () => {
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    initialSettingsFormState,
  );
  const dialogActionsRef = useRef<AlertDialogRootActions | null>(null);
  const hasError = state.status === "error";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          <h2>Delete account</h2>
        </CardTitle>
        <CardDescription>
          Permanently delete this account and every recipe in your cookbook.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog actionsRef={dialogActionsRef}>
          <AlertDialogTrigger
            render={
              <Button type="button" variant="destructive" disabled={pending} />
            }
          >
            <Trash2 />
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent
            onBackdropClick={() => {
              if (!pending) {
                dialogActionsRef.current?.close();
              }
            }}
          >
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                <Trash2 />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Enter your password to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <FieldGroup className="gap-4">
                <Field data-invalid={hasError || undefined}>
                  <FieldLabel htmlFor="delete-account-password">
                    Password
                  </FieldLabel>
                  <Input
                    id="delete-account-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    aria-invalid={hasError || undefined}
                  />
                  <FieldError>{hasError ? state.message : null}</FieldError>
                </Field>
              </FieldGroup>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  variant="destructive"
                  disabled={pending}
                >
                  {pending ? "Deleting..." : "Delete account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export { DeleteAccount };
