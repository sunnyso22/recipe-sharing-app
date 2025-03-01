import React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Heart, User, UserRound } from "lucide-react";
import Link from "next/link";

const RecipeCard = ({ id, title, author, image, likes }: Recipes) => {
    return (
        <Card>
            <Link href={`/recipes/${id}`}>
                <Image src={image} alt={title} width={1000} height={1000} />
                <CardContent>
                    <h2 className="text-lg font-bold">{title}</h2>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={author.image} alt={author.name} />
                            <AvatarFallback>
                                <UserRound className="text-primary" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600">{author.name}</span>
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
