import { ObjectId } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { Heart, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardFooter } from "./ui/card";
import FavouriteButton from "./FavouriteButton";
import { Recipe } from "@/types";

const RecipeCard = async (recipe: Recipe) => {
    const user = await currentUser();

    const { _id, title, imageId, likes, author } = recipe;

    // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const imageUrl = imageId ? `/api/images/${imageId}` : null;

    return (
        <Card>
            <div className="relative w-[640px] h-[360px]">
                <Image
                    className="object-cover"
                    src={imageUrl || "/images/placeholder.webp"}
                    alt={title}
                    fill
                />
            </div>
            <CardContent>
                <Link
                    href={`/recipes/${(_id as ObjectId).toString()}`}
                    className="after:absolute after:inset-0"
                >
                    <h2 className="text-lg font-bold">{title}</h2>
                </Link>
            </CardContent>
            <CardFooter>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={author.aImage || ""}
                            alt={author.aName || ""}
                        />
                        <AvatarFallback>
                            <UserRound className="text-accent" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="relative text-paragraph hover:border-b-1">
                        {author.aName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {user ? (
                        <FavouriteButton
                            recipe={JSON.parse(JSON.stringify(recipe))}
                        />
                    ) : (
                        <Link
                            href="/sign-in"
                            className="relative flex items-center gap-2"
                        >
                            <span className="text-red-400 text-xl font-bold">
                                {likes}
                            </span>
                            <Heart
                                className="transition-all hover:scale-125"
                                color="#ff6467"
                                size={28}
                            />
                        </Link>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default RecipeCard;
