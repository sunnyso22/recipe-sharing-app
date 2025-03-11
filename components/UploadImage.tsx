"use client";

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "./ui/input";
import Image from "next/image";

const UploadImage = ({
    onImageChange,
    error,
}: {
    onImageChange: (imageData: string | null) => void;
    error?: string;
}) => {
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // console.log(file);
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
                const imageData = reader.result as string;
                setImage(imageData);
                onImageChange(imageData);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-1/2 flex flex-col gap-2">
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={`h-[360px] cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 ${
                            image
                                ? `border border-primary`
                                : `border-dashed border-muted`
                        } hover:bg-muted/20`}
                        onClick={triggerUpload}
                    >
                        {image ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={image}
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
                            name="image"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
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
                    <ContextMenuItem onClick={removeImage} disabled={!image}>
                        Remove Image
                        <ContextMenuShortcut>
                            <Trash2 className="h-4 w-4" />
                        </ContextMenuShortcut>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <div className="flex gap-3">
                <p className="text-sm text-paragraph">
                    {image
                        ? "Image uploaded. Right-click for options."
                        : "No image uploaded yet."}
                </p>
                {error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : (
                    <p>&nbsp;</p>
                )}
            </div>
        </div>
    );
};

export default UploadImage;
