"use client";

import { Bookmark, BookOpen, ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const initialsFor = (name: string) => {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");

  return letters.toUpperCase() || "?";
};

const UserMenu = ({ name }: { name: string }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "ml-1 h-auto gap-2 px-1.5 py-1",
        )}
      >
        <Avatar>
          <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
            {initialsFor(name)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-28 truncate sm:max-w-40">{name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuItem render={<Link href="/cookbook" />}>
          <BookOpen />
          Cookbook
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/bookmarks" />}>
          <Bookmark />
          Bookmarks
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            variant="destructive"
            className="w-full"
            nativeButton
            render={<button type="submit" />}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserMenu };
