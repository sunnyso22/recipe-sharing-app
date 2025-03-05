"use client";

import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Search } from "lucide-react";
import { redirect, usePathname } from "next/navigation";

const SearchBar = ({ searchString }: { searchString?: string }) => {
    const path = usePathname();

    return (
        <Form action="/recipes" className="flex gap-3">
            <Input
                name="search"
                type="text"
                defaultValue={searchString}
                placeholder="Anything want to cook today?"
                className="w-72"
            />
            <Button type="submit" className="flex gap-2">
                <Search />
            </Button>
            {path === "/" ? (
                <></>
            ) : (
                <Button
                    onClick={() => redirect("/recipes")}
                    type="reset"
                    variant="outline"
                >
                    <RotateCcw />
                </Button>
            )}
        </Form>
    );
};

export default SearchBar;
