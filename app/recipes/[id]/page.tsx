import { getRecipeById } from "@/app/actions/recipes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, Heart, Share, UserRound } from "lucide-react";
import Image from "next/image";

const RecipeDetail = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const recipeDetail: Recipes = await getRecipeById(id);
    const {
        author,
        likes,
        image,
        title,
        description,
        ingredients,
        seasonings,
        instructions,
    } = recipeDetail;

    return (
        <div className="container mx-auto mt-12">
            <div className="flex gap-6">
                <div className="relative w-[960px] h-[540px]">
                    <Image
                        className="object-cover rounded-2xl"
                        src={`/images/${image}`}
                        alt={title}
                        fill
                    />
                </div>
                <div className="w-full flex flex-col justify-between">
                    <div className="flex flex-col gap-8">
                        <h2 className="text-3xl font-extrabold">{title}</h2>
                        <p className="text-secondary text-xl">{description}</p>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={author.image}
                                    alt={author.name}
                                />
                                <AvatarFallback>
                                    <UserRound className="text-accent" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-secondary">
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
                            <Bookmark size={28} />
                            <Share size={28} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-36">
                <div className="w-1/4 py-6">
                    <h3 className="text-2xl font-semibold py-6">Ingredients</h3>
                    <ul>
                        {ingredients.map((item, index) => (
                            <li key={index} className="flex justify-between">
                                <span className="text-xl text-secondary">
                                    {item.name}
                                </span>
                                <span className="text-xl text-secondary font-semibold">
                                    {item.quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <h3 className="text-2xl font-semibold py-6">Seasonings</h3>
                    <ul>
                        {seasonings.map((item, index) => (
                            <li key={index} className="flex justify-between">
                                <span className="text-xl text-secondary">
                                    {item.name}
                                </span>
                                <span className="text-xl text-secondary font-semibold">
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
                        {instructions.map((item, index) => (
                            <li key={index} className="flex gap-3">
                                <span className="flex justify-center items-center text-xl text-white bg-gray-600 rounded-full h-8 w-8">
                                    {item.step}
                                </span>
                                <span className="text-xl text-secondary font-semibold">
                                    {item.description}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RecipeDetail;
