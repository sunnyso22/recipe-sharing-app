import { ObjectId } from "mongodb";
type Author = {
    name: string;
    image?: string;
};
type Ingredient = {
    name: string;
    quantity: string;
};
type Seasoning = {
    name: string;
    quantity: string;
};
type Instruction = {
    step: string;
    description: string;
};
type Recipe = {
    _id: ObjectId;
    title: string;
    description: string;
    image: string;
    author: Author;
    likes: number;
    ingredients: Ingredient[];
    seasonings: Seasoning[];
    instructions: Instruction[];
};
