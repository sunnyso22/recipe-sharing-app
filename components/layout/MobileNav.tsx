import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ChefHat, Menu } from "lucide-react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet";

const links = [
    {
        name: "Home",
        path: "/",
    },
    {
        name: "Recipes",
        path: "/recipes",
    },
];

const MobileNav = () => {
    return (
        <Sheet>
            <SheetTrigger>
                <Menu
                    size={48}
                    className="cursor-pointer hover:scale-125 transition-all"
                />
            </SheetTrigger>
            <SheetContent>
                <SheetTitle className="hidden">Menu</SheetTitle>
                {/* Logo */}
                <div className="mt-32 mb-40">
                    <SheetClose asChild>
                        <Link href="/">
                            <h1 className="flex justify-center items-center gap-1 text-4xl font-semibold italic text-primary">
                                Cookery
                                <ChefHat size={36} />
                            </h1>
                        </Link>
                    </SheetClose>
                </div>

                {/* Nav */}
                <nav className="flex flex-col justify-center items-center gap-8 text-paragraph">
                    {links.map((link, index) => (
                        <SheetClose key={index} asChild>
                            <Link
                                href={link.path}
                                key={index}
                                className="hover:text-accent"
                            >
                                <h2 className="text-2xl">{link.name}</h2>
                            </Link>
                        </SheetClose>
                    ))}

                    <SignedOut>
                        <SheetClose asChild>
                            <Link
                                className="text-2xl hover:text-accent"
                                href="/sign-in"
                            >
                                Sign In
                            </Link>
                        </SheetClose>
                    </SignedOut>

                    <SignedIn>
                        <SheetClose asChild>
                            <Link
                                className="text-2xl hover:text-accent"
                                href="/cookbook"
                            >
                                Cookbook
                            </Link>
                        </SheetClose>
                        <UserButton />
                    </SignedIn>
                </nav>
            </SheetContent>
        </Sheet>
    );
};

export default MobileNav;
