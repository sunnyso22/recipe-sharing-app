import React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Heart, UserRound } from "lucide-react";
import Link from "next/link";
import { Recipe } from "@/types";

const RecipeCard = ({ _id, title, author, image, likes }: Recipe) => {
    return (
        <Card>
            <Link href={`/recipes/${_id}`}>
                <div className="relative w-[640px] h-[360px]">
                    <Image
                        className="object-cover"
                        src={image || "/images/placeholder.webp"}
                        alt={title}
                        fill
                    />
                </div>
                <CardContent>
                    <h2 className="text-lg font-bold">{title}</h2>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={author.image || ""}
                                alt={author.name || ""}
                            />
                            <AvatarFallback>
                                <UserRound className="text-accent" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-paragraph hover:border-b-1">
                            {author.name}
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-red-400 text-xl">{likes}</span>
                        <Heart
                            className="transition-all hover:scale-125"
                            color="#ff6467"
                            size={28}
                        />
                    </div>
                </CardFooter>
            </Link>
        </Card>
    );
};

export default RecipeCard;
