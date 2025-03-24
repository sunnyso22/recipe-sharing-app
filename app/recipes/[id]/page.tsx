import { ObjectId } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, Pencil, UserRound } from "lucide-react";
import { getAllRecipes, getRecipeById } from "@/actions/recipes";
import BookmarkButton from "@/components/BookmarkButton";
import DeleteButton from "@/components/DeleteButton";
import FavouriteButton from "@/components/FavouriteButton";
import ShareButton from "@/components/ShareButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Ingredient, Instruction, Recipe, Seasoning } from "@/types";

export const generateStaticParams = async () => {
    const recipeData: Recipe[] = (await getAllRecipes()) || [];
    return recipeData.map((recipe) => ({
        id: recipe._id.toString(),
    }));
};

const RecipeDetail = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const user = await currentUser();

    const recipeData: Recipe = (await getRecipeById(id)) || {
        _id: new ObjectId(),
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const postUrl = `${baseUrl}recipes/${id}`;

    return (
        <div className="container mx-auto mt-12">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Recipe Image */}
                <div className="relative w-full h-[540px]">
                    <Image
                        className="object-cover rounded-2xl"
                        src={image || "/images/placeholder.webp"}
                        alt={title}
                        fill
                    />
                </div>
                <div className="w-full flex flex-col justify-between gap-6">
                    {/* Tilte + Edit/Delete Button + Description */}
                    <div className="flex flex-col gap-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-extrabold">{title}</h2>
                            {user && user.fullName === author.name ? (
                                <div className="flex gap-6">
                                    <Link href={`/cookbook/write/${id}`}>
                                        <Button variant="outline">
                                            <Pencil />
                                            Edit
                                        </Button>
                                    </Link>
                                    <DeleteButton id={id} title={title} />
                                </div>
                            ) : (
                                <></>
                            )}
                        </div>
                        <p className="text-paragraph text-xl">{description}</p>
                    </div>
                    {/* Author + Like/Bookmark/Share Button */}
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
                            {user ? (
                                <FavouriteButton
                                    id={id}
                                    recipe={JSON.parse(
                                        JSON.stringify(recipeData)
                                    )}
                                    likes={likes}
                                />
                            ) : (
                                <Link
                                    href="/sign-in"
                                    className="flex items-center gap-2"
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
                            {user ? (
                                <BookmarkButton id={id} />
                            ) : (
                                <Link href="/sign-in">
                                    <Bookmark
                                        size={28}
                                        className="transition-all hover:scale-125 cursor-pointer"
                                    />
                                </Link>
                            )}
                            <ShareButton url={postUrl} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-12 lg:gap-36">
                <div className="w-2/5 lg:w-1/4 py-6">
                    {/* Ingredients */}
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
                    {/* Seasonings */}
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
                <div className="w-3/5 lg:w-3/4 py-6">
                    {/* Instructions */}
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
