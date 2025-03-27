"use client";

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import Image from "next/image";
import { Recipe } from "@/types";

const ImageUpload = ({
    recipe,
    backendError,
}: {
    recipe: Recipe;
    backendError?: string;
}) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageAction, setImageAction] = useState("keep");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const imageUrl = recipe.imageId ? `/api/images/${recipe.imageId}` : null;

    useEffect(() => {
        setImagePreview(imageUrl);
    }, [imageUrl]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setImageAction("replace");
            const reader = new FileReader();
            reader.onload = () => {
                const imageData = reader.result as string;
                setImagePreview(imageData);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setImageAction("remove");
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-2">
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={`h-[360px] cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 ${
                            imagePreview
                                ? `border border-primary`
                                : `border-dashed border-muted`
                        } hover:bg-muted/20`}
                        onClick={triggerUpload}
                    >
                        {imagePreview ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={imagePreview}
                                    alt="Uploaded preview"
                                    className="object-contain"
                                    fill
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                                <ImageIcon className="h-10 w-10 text-paragraph" />
                                <p className="text-black">Click to upload</p>
                                <p className="text-xs text-paragraph">
                                    Right-click for more options
                                </p>
                            </div>
                        )}
                        <Input
                            hidden
                            name="imageFile"
                            type="file"
                            ref={fileInputRef}
                            accept="image/png, image/jpeg"
                            onChange={handleImageUpload}
                        />
                        <Input
                            hidden
                            name="imageAction"
                            value={imageAction}
                            onChange={() => {}}
                        />
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    <ContextMenuItem onClick={triggerUpload}>
                        Upload Image
                        <ContextMenuShortcut>
                            <Upload className="h-4 w-4" />
                        </ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={removeImage}
                        disabled={!imagePreview}
                    >
                        Remove Image
                        <ContextMenuShortcut>
                            <Trash2 className="h-4 w-4" />
                        </ContextMenuShortcut>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <div className="flex gap-3">
                <p className="text-sm text-paragraph">
                    {imagePreview
                        ? "Image uploaded. Right-click for options."
                        : "No image uploaded yet."}
                </p>
                {backendError ? (
                    <p className="text-sm text-red-500">{backendError}</p>
                ) : (
                    <p>&nbsp;</p>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
