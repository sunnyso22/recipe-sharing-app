import { ObjectId } from "mongodb";
type Author = {
    name: string | null;
    image: string | null;
};
type Ingredient = {
    id: number;
    name: string;
    quantity: string;
};
type Seasoning = {
    id: number;
    name: string;
    quantity: string;
};
type Instruction = {
    step: number;
    description: string;
};
type Recipe = {
    _id: ObjectId;
    title: string;
    description: string;
    image: string | null;
    author: Author;
    likes: number;
    ingredients: Ingredient[];
    seasonings: Seasoning[];
    instructions: Instruction[];
};

type Errors = {
    image?: string;
    title?: string;
    description?: string;
};
type FormState = {
    errors: Errors;
};
