"use client";

import Form from "next/form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SearchBar = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <>
            {pathname === "/" ? (
                <Form action="/recipes" className="flex gap-3">
                    <Input
                        name="search"
                        type="text"
                        placeholder="Anything want to cook today?"
                        className="w-72"
                    />
                    <Button type="submit">
                        <Search />
                    </Button>
                </Form>
            ) : (
                <Form action="" className="flex gap-3">
                    <Input
                        type="text"
                        defaultValue={searchParams.get("search")?.toString()}
                        placeholder="Anything want to cook today?"
                        onChange={(e) => {
                            handleSearch(e.target.value);
                        }}
                        className="w-72"
                    />
                    <Button
                        type="reset"
                        variant="outline"
                        onClick={() => {
                            replace(`${pathname}`);
                        }}
                    >
                        <RotateCcw />
                    </Button>
                </Form>
            )}
        </>
    );
};

export default SearchBar;
