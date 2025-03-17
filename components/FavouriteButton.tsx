"use client";

import { addLike, removeLike } from "@/actions/action";
import { useUserContext } from "@/context/UserContext";
import { Recipe } from "@/types";
import { Heart } from "lucide-react";

const FavouriteButton = ({
    id,
    recipe,
    likes,
}: {
    id: string;
    recipe: Recipe;
    likes: number;
}) => {
    const { favList, addFavourite, removeFavourite } = useUserContext();

    const handleAddFavourite = (e: React.MouseEvent) => {
        e.preventDefault();
        addLike(id, recipe, likes);
        addFavourite(id);
    };

    const handleRemoveFavourite = (e: React.MouseEvent) => {
        e.preventDefault();
        removeLike(id, recipe, likes);
        removeFavourite(id);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-red-400 text-xl font-bold">{likes}</span>
            {favList.includes(id) ? (
                <Heart
                    className="relative transition-all hover:scale-125 cursor-pointer"
                    color="#ff6467"
                    size={28}
                    fill="#ff6467"
                    onClick={handleRemoveFavourite}
                />
            ) : (
                <Heart
                    className="relative transition-all hover:scale-125 cursor-pointer"
                    color="#ff6467"
                    size={28}
                    onClick={handleAddFavourite}
                />
            )}
        </div>
    );
};

export default FavouriteButton;
