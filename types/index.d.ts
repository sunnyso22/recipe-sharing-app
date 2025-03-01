type Recipes = {
    id: string;
    title: string;
    description: string;
    image: string;
    author: {
        name: string;
        image?: string;
    };
    likes: number;
    ingredients: {
        name: string;
        quantity: string;
    }[];
    seasonings: {
        name: string;
        quantity: string;
    }[];
    instructions: {
        steps: string;
        description: string;
    }[];
};
