import React from "react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "./ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

const links = [
    {
        name: "Home",
        path: "/",
    },
    {
        name: "Recipes",
        path: "/recipes",
    },
    {
        name: "Login",
        path: "/login",
    },
];

const MobileNav = () => {
    return (
        <Sheet>
            <SheetTrigger>
                <Menu size={48} />
            </SheetTrigger>
            <SheetContent>
                <SheetTitle className="hidden">Menu</SheetTitle>
                {/* Logo */}
                <div className="mt-32 mb-40 text-center text-2xl">
                    <Link href="/">
                        <h1 className="text-4xl font-semibold italic text-primary">
                            Cookery
                        </h1>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex flex-col justify-center items-center gap-8">
                    {links.map((link, index) => (
                        <SheetClose key={index} asChild>
                            <Link href={link.path} key={index}>
                                <h2 className="text-2xl">{link.name}</h2>
                            </Link>
                        </SheetClose>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
};

export default MobileNav;
