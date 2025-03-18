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
import { useUserContext } from "@/context/UserContext";

const DeleteButton = ({ id, title }: { id: string; title: string }) => {
    const [open, setOpen] = useState(false);
    const { removeFavourite } = useUserContext();

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
                            You are about to delete "{title}". This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Form
                            onSubmit={() => {
                                removeFavourite(id);
                            }}
                            action={removeRecipe.bind(null, id)}
                        >
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
