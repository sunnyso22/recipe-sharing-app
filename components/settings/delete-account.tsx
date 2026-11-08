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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialSettingsFormState } from "@/lib/settings/form";

const DeleteAccount = ({ email }: { email: string }) => {
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    initialSettingsFormState,
  );
  const dialogActionsRef = useRef<AlertDialogRootActions | null>(null);

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
                This cannot be undone. Type {email} to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="delete-account-email">Email</FieldLabel>
                <Input
                  id="delete-account-email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  defaultValue={state.values.email ?? ""}
                />
                <FieldError>
                  {state.status === "error" ? state.message : null}
                </FieldError>
              </Field>
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
