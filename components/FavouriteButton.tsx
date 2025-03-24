"use client";

import { Heart } from "lucide-react";
import { addLike, removeLike } from "@/actions/action";
import { useUserContext } from "@/context/UserContext";
import { Recipe } from "@/types";

const FavouriteButton = ({ recipe }: { recipe: Recipe }) => {
    const { favList, addFavourite, removeFavourite } = useUserContext();

    const handleAddFavourite = (e: React.MouseEvent) => {
        e.preventDefault();
        addLike(recipe);
        addFavourite(recipe._id.toString());
    };

    const handleRemoveFavourite = (e: React.MouseEvent) => {
        e.preventDefault();
        removeLike(recipe);
        removeFavourite(recipe._id.toString());
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-red-400 text-xl font-bold">
                {recipe.likes}
            </span>
            {favList.includes(recipe._id.toString()) ? (
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
