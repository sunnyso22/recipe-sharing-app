import { ObjectId } from "mongodb";
type Author = {
    aName: string | null;
    aImage: string | null;
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
    _id?: ObjectId;
    title: string;
    description: string;
    imageId: string;
    author: Author;
    likes: number;
    ingredients: Ingredient[];
    seasonings: Seasoning[];
    instructions: Instruction[];
};

type FormErrors = {
    image?: string;
    title?: string;
    description?: string;
};
type FormState = {
    errors: FormErrors;
};

type Metadata = {
    favList?: string[];
    bmList?: string[];
};
