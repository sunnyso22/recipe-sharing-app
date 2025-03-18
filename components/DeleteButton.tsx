"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import Form from "next/form";
import { removeRecipe } from "@/actions/action";

const DeleteButton = ({ id, title }: { id: string; title: string }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Trash2 />
                Delete
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Are you sure you want to delete this recipe?
                        </DialogTitle>
                        <DialogDescription>
                            You are about to delete{" "}
                            <span className="text-accent font-bold">
                                {title}
                            </span>
                            . This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Form action={removeRecipe.bind(null, id)}>
                            <Button>
                                <Trash2 />
                                Delete
                            </Button>
                        </Form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DeleteButton;
