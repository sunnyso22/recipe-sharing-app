"use client";

import { useUserContext } from "@/context/UserContext";
import { Bookmark } from "lucide-react";
import React from "react";

const BookmarkButton = ({ id }: { id: string }) => {
    const { bmList, addBookmark, removeBookmark } = useUserContext();

    const handleAddBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        addBookmark(id);
    };

    const handleRemoveBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        removeBookmark(id);
    };

    return (
        <>
            {bmList.includes(id) ? (
                <Bookmark
                    size={28}
                    fill="#000000"
                    className="transition-all hover:scale-125 cursor-pointer"
                    onClick={handleRemoveBookmark}
                />
            ) : (
                <Bookmark
                    size={28}
                    className="transition-all hover:scale-125 cursor-pointer"
                    onClick={handleAddBookmark}
                />
            )}
        </>
    );
};

export default BookmarkButton;
