"use client";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CirclePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Ingredient, Recipe } from "@/types";

const IngredientsUpload = ({
    onIngredientsChange,
    recipe,
}: {
    onIngredientsChange: (recipeData: Recipe) => void;
    recipe: Recipe;
}) => {
    const [fields, setFields] = useState<Ingredient[]>([]);

    useEffect(() => {
        setFields(recipe.ingredients);
    }, [recipe.ingredients]);

    const addField = () => {
        const newId =
            fields.length > 0
                ? Math.max(...fields.map((field) => field.id)) + 1
                : 1;
        setFields([...fields, { id: newId, name: "", quantity: "" }]);
    };

    const removeField = (id: number) => {
        if (fields.length > 1) {
            setFields(fields.filter((field) => field.id !== id));
            onIngredientsChange({
                ...recipe,
                ingredients: fields.filter((field) => field.id !== id),
            });
        }
    };

    const handleNameChange = (id: number, value: string) => {
        setFields(
            fields.map((field) =>
                field.id === id ? { ...field, name: value } : field
            )
        );
        onIngredientsChange({
            ...recipe,
            ingredients: fields.map((field) =>
                field.id === id ? { ...field, name: value } : field
            ),
        });
    };

    const handleQtyChange = (id: number, value: string) => {
        setFields(
            fields.map((field) =>
                field.id === id ? { ...field, quantity: value } : field
            )
        );
        onIngredientsChange({
            ...recipe,
            ingredients: fields.map((field) =>
                field.id === id ? { ...field, quantity: value } : field
            ),
        });
    };

    return (
        <div className="w-full">
            <h3 className="text-2xl font-semibold py-6">Ingredients</h3>
            {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 py-3 items-center">
                    <Input
                        type="text"
                        placeholder={`Ingredient ${index + 1}`}
                        value={field.name}
                        onChange={(e) =>
                            handleNameChange(field.id, e.target.value)
                        }
                        className="w-full"
                    />
                    <Input
                        type="text"
                        placeholder="Quantity"
                        value={field.quantity}
                        onChange={(e) =>
                            handleQtyChange(field.id, e.target.value)
                        }
                        className="w-full"
                    />
                    {fields.length > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeField(field.id)}
                        >
                            <X />
                        </Button>
                    )}
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                className="mt-3 flex items-center gap-1"
                onClick={addField}
            >
                <CirclePlus />
                <span>Add Ingredient</span>
            </Button>
        </div>
    );
};

export default IngredientsUpload;
