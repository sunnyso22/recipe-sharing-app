"use client";

import { CirclePlus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { Instruction, Recipe } from "@/types";

const InstructionsUpload = ({
    onInstructionsChange,
    recipe,
}: {
    onInstructionsChange: (recipeData: Recipe) => void;
    recipe: Recipe;
}) => {
    const [fields, setFields] = useState<Instruction[]>([]);

    useEffect(() => {
        setFields(recipe.instructions);
    }, [recipe.instructions]);

    const addField = () => {
        const newId =
            fields.length > 0
                ? Math.max(...fields.map((field) => field.step)) + 1
                : 1;
        setFields([...fields, { step: newId, description: "" }]);
    };

    const removeField = (step: number) => {
        if (fields.length > 1) {
            setFields(fields.filter((field) => field.step !== step));
            onInstructionsChange({
                ...recipe,
                instructions: fields.filter((field) => field.step !== step),
            });
        }
    };

    const handleChange = (step: number, value: string) => {
        setFields(
            fields.map((field) =>
                field.step === step ? { ...field, description: value } : field
            )
        );
        onInstructionsChange({
            ...recipe,
            instructions: fields.map((field) =>
                field.step === step ? { ...field, description: value } : field
            ),
        });
    };

    return (
        <div className="w-full">
            <h3 className="text-2xl font-semibold py-6">Instructions</h3>
            {fields.map((field, index) => (
                <div key={field.step} className="flex gap-3 py-3 items-center">
                    <span className="flex justify-center items-center text-xl text-white bg-paragraph rounded-full h-8 w-8">
                        {index + 1}
                    </span>
                    <Input defaultValue={field.step} hidden />
                    <Input
                        type="text"
                        placeholder={`Instruction ${index + 1}`}
                        value={field.description}
                        onChange={(e) =>
                            handleChange(field.step, e.target.value)
                        }
                        className="w-full"
                    />
                    {fields.length > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeField(field.step)}
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
                <span>Add Instruction</span>
            </Button>
        </div>
    );
};

export default InstructionsUpload;
