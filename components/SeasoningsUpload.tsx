"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CirclePlus, X } from "lucide-react";
import { useState } from "react";
import { Seasoning } from "@/types";

const SeasoningsUpload = ({
    onSeasoningsChange,
}: {
    onSeasoningsChange: (seasoningsData: Seasoning[]) => void;
}) => {
    const [fields, setFields] = useState<Seasoning[]>([
        { id: 1, name: "", quantity: "" },
    ]);

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
        }
    };

    const handleNameChange = (id: number, value: string) => {
        setFields(
            fields.map((field) =>
                field.id === id ? { ...field, name: value } : field
            )
        );
        onSeasoningsChange(fields);
    };
    const handleQtyChange = (id: number, value: string) => {
        setFields(
            fields.map((field) =>
                field.id === id ? { ...field, quantity: value } : field
            )
        );
        onSeasoningsChange(fields);
    };

    return (
        <div className="w-full">
            <h3 className="text-2xl font-semibold py-6">Seasonings</h3>
            {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 py-3">
                    <Input
                        name={`seasoning-${field.id}`}
                        type="text"
                        placeholder={`Seasoning ${index + 1}`}
                        value={field.name}
                        onChange={(e) =>
                            handleNameChange(field.id, e.target.value)
                        }
                        className="w-full"
                    />
                    <Input
                        name={`seasoning-qty-${field.id}`}
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
                            size="icon"
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
                <span>Add Seasoning</span>
            </Button>
        </div>
    );
};

export default SeasoningsUpload;
