"use client";

import { Bookmark, Heart } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import {
  setRecipeBookmarkAction,
  setRecipeLikeAction,
} from "@/app/recipes/[id]/actions";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const bareToggleClass =
  "h-9 min-w-9 gap-1.5 rounded-full bg-transparent px-1.5 text-sm text-foreground hover:bg-transparent hover:opacity-70 aria-pressed:bg-transparent [&_svg]:transition-transform active:*:[svg]:scale-90";

const likeLabel = (count: number, isLiked: boolean) => {
  const likes = count === 1 ? "1 like" : `${count} likes`;

  return isLiked
    ? `Unlike this recipe. ${likes}`
    : `Like this recipe. ${likes}`;
};

const RecipeEngagement = ({
  recipeId,
  likeCount,
  liked,
  bookmarked,
  compact = false,
  showBookmark = true,
}: {
  recipeId: number;
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  compact?: boolean;
  showBookmark?: boolean;
}) => {
  const [message, setMessage] = useState("");
  const [, startLike] = useTransition();
  const [, startBookmark] = useTransition();
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { liked, likeCount },
    (current: { liked: boolean; likeCount: number }, nextLiked: boolean) => {
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
      <div className="flex flex-wrap items-center gap-4">
        <Toggle
          pressed={optimisticLike.liked}
          aria-label={likeLabel(optimisticLike.likeCount, optimisticLike.liked)}
          className={cn(
            bareToggleClass,
            "relative size-9 shrink-0 gap-0 px-0 aria-pressed:*:[svg]:fill-destructive aria-pressed:*:[svg]:text-destructive",
          )}
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
          <span className="absolute top-1/2 right-full -translate-y-1/2 text-xl leading-none whitespace-nowrap tabular-nums">
            {optimisticLike.likeCount}
          </span>
        </Toggle>
        {showBookmark ? (
          <Toggle
            pressed={optimisticBookmarked}
            aria-label={
              optimisticBookmarked
                ? "Remove bookmark from this recipe"
                : "Bookmark this recipe"
            }
            className={cn(bareToggleClass, "aria-pressed:*:[svg]:fill-current")}
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
        ) : null}
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
    <div className="flex items-center gap-4" aria-hidden>
      <div className="size-9 animate-pulse rounded-full bg-muted" />
      <div className="size-9 animate-pulse rounded-full bg-muted" />
    </div>
  );
};

export { RecipeEngagement, RecipeEngagementFallback };
