import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
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
                    <SheetClose asChild>
                        <Link href="/">
                            <h1 className="text-4xl font-semibold italic text-primary">
                                Cookery
                            </h1>
                        </Link>
                    </SheetClose>
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

                    <SignedOut>
                        <Link
                            className="text-2xl hover:text-accent"
                            href="/sign-in"
                        >
                            Sign In
                        </Link>
                    </SignedOut>

                    <SignedIn>
                        <SheetClose asChild>
                            <Link
                                className="text-2xl hover:text-accent"
                                href="/profile"
                            >
                                Profile
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
