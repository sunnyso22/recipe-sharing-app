"use client";

import type { AlertDialogRootActions } from "@base-ui/react/alert-dialog";
import { Trash2 } from "lucide-react";
import { useActionState, useRef } from "react";

import {
  deleteRecipeAction,
  type DeleteRecipeState,
} from "@/app/recipes/[id]/actions";
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

const initialState: DeleteRecipeState = { message: "" };

const DeleteRecipeButton = ({
  recipeId,
  redirectTo,
  size = "default",
}: {
  recipeId: number;
  redirectTo?: string;
  size?: "default" | "sm";
}) => {
  const [state, formAction, pending] = useActionState(
    deleteRecipeAction,
    initialState,
  );
  const dialogActionsRef = useRef<AlertDialogRootActions | null>(null);

  return (
    <AlertDialog actionsRef={dialogActionsRef}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size={size}
            disabled={pending}
          />
        }
      >
        <Trash2 />
        Delete
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
          <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. The recipe and its ingredients, seasonings,
            and instructions will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state.message ? (
          <p className="text-center text-sm text-destructive sm:text-left">
            {state.message}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <form action={formAction} className="contents">
            <input type="hidden" name="recipeId" value={recipeId} />
            {redirectTo ? (
              <input type="hidden" name="next" value={redirectTo} />
            ) : null}
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={pending}
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { DeleteRecipeButton };
