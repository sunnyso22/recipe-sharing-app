import { getRecipeById } from "@/actions/recipes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Ingredient, Instruction, Recipe, Seasoning } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { Bookmark, Heart, Share, UserRound } from "lucide-react";
import { ObjectId } from "mongodb";
import Image from "next/image";
import Link from "next/link";

const RecipeDetail = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const user = await currentUser();

    const recipeData: Recipe = (await getRecipeById(id)) || {
        _id: new ObjectId(""),
        author: { name: "", image: "" },
        likes: 0,
        image: "",
        title: "",
        description: "",
        ingredients: [],
        seasonings: [],
        instructions: [],
    };

    const {
        author,
        likes,
        image,
        title,
        description,
        ingredients,
        seasonings,
        instructions,
    } = recipeData;

    return (
        <div className="container mx-auto mt-12">
            <div className="flex gap-6">
                <div className="relative w-[1280px] h-[540px]">
                    <Image
                        className="object-cover rounded-2xl"
                        src={image || "/images/placeholder.webp"}
                        alt={title}
                        fill
                    />
                </div>
                <div className="w-full flex flex-col justify-between">
                    <div className="flex flex-col gap-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-extrabold">{title}</h2>
                            {user && user.fullName === author.name ? (
                                <div className="flex gap-6">
                                    <Link href={`/profile/write/${id}`}>
                                        <Button variant="outline">Edit</Button>
                                    </Link>
                                    <Button>Delete</Button>
                                </div>
                            ) : (
                                <></>
                            )}
                        </div>
                        <p className="text-paragraph text-xl">{description}</p>
                    </div>
                    <div className="flex justify-between">
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
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400 text-xl">
                                    {likes}
                                </span>
                                <Heart
                                    className="transition-all hover:scale-125"
                                    color="#ff6467"
                                    size={28}
                                />
                            </div>
                            <Bookmark
                                size={28}
                                className="transition-all hover:scale-125"
                            />
                            <Share
                                size={28}
                                className="transition-all hover:scale-125"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-36">
                <div className="w-1/4 py-6">
                    <h3 className="text-2xl font-semibold py-6">Ingredients</h3>
                    <ul>
                        {ingredients.map((item: Ingredient) => (
                            <li
                                key={item.name}
                                className="flex justify-between text-paragraph"
                            >
                                <span className="text-xl">{item.name}</span>
                                <span className="text-xl font-semibold">
                                    {item.quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <h3 className="text-2xl font-semibold py-6">Seasonings</h3>
                    <ul>
                        {seasonings.map((item: Seasoning) => (
                            <li
                                key={item.name}
                                className="flex justify-between text-paragraph"
                            >
                                <span className="text-xl">{item.name}</span>
                                <span className="text-xl font-semibold">
                                    {item.quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-3/4 py-6">
                    <h3 className="text-2xl font-semibold py-6">
                        Instructions
                    </h3>
                    <ul className="flex flex-col gap-6">
                        {instructions.map((item: Instruction, index) => (
                            <li
                                key={item.step}
                                className="flex gap-3 text-paragraph"
                            >
                                <span className="flex justify-center items-center text-xl text-white bg-paragraph rounded-full h-8 w-8">
                                    {index + 1}
                                </span>
                                <p className="text-xl font-semibold">
                                    {item.description}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RecipeDetail;
