"use client";

import { Bookmark, Heart } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import {
  setRecipeBookmarkAction,
  setRecipeLikeAction,
} from "@/app/recipes/[id]/actions";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const pressedIconClass =
  "px-0 hover:bg-transparent hover:text-current aria-pressed:bg-transparent aria-pressed:*:[svg]:fill-primary aria-pressed:*:[svg]:text-primary";

const iconToggleClass = `size-12 ${pressedIconClass}`;

const RecipeEngagement = ({
  recipeId,
  likeCount,
  liked,
  bookmarked,
  compact = false,
}: {
  recipeId: number;
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  compact?: boolean;
}) => {
  const [message, setMessage] = useState("");
  const [, startLike] = useTransition();
  const [, startBookmark] = useTransition();
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { liked, likeCount },
    (
      current: { liked: boolean; likeCount: number },
      nextLiked: boolean,
    ) => {
      if (nextLiked === current.liked) {
        return current;
      }

      return {
        liked: nextLiked,
        likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
      };
    },
  );
  const [optimisticBookmarked, setOptimisticBookmarked] =
    useOptimistic(bookmarked);

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        compact ? "items-end" : "items-start",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          pressed={optimisticLike.liked}
          aria-label={
            optimisticLike.liked
              ? `Unlike this recipe. ${optimisticLike.likeCount} likes`
              : `Like this recipe. ${optimisticLike.likeCount} likes`
          }
          className={iconToggleClass}
          onPressedChange={(pressed) => {
            setMessage("");
            startLike(async () => {
              setOptimisticLike(pressed);
              const result = await setRecipeLikeAction(recipeId, pressed);
              if (result.message) {
                setMessage(result.message);
              }
            });
          }}
        >
          <Heart className="size-6" />
        </Toggle>
        <Toggle
          pressed={optimisticBookmarked}
          aria-label={
            optimisticBookmarked
              ? "Remove bookmark from this recipe"
              : "Bookmark this recipe"
          }
          className={iconToggleClass}
          onPressedChange={(pressed) => {
            setMessage("");
            startBookmark(async () => {
              setOptimisticBookmarked(pressed);
              const result = await setRecipeBookmarkAction(recipeId, pressed);
              if (result.message) {
                setMessage(result.message);
              }
            });
          }}
        >
          <Bookmark className="size-6" />
        </Toggle>
      </div>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
};

const RecipeEngagementFallback = () => {
  return (
    <div className="flex gap-2" aria-hidden>
      <div className="size-12 animate-pulse rounded-3xl bg-muted" />
      <div className="size-12 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
};

export { RecipeEngagement, RecipeEngagementFallback };
