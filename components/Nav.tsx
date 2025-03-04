import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

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

const Nav = () => {
    return (
        <nav className="flex gap-8">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.path}
                    className="font-medium text-2xl hover:text-accent"
                >
                    {link.name}
                </Link>
            ))}
            <SignedOut>
                <Link className="text-2xl hover:text-accent" href="/sign-in">
                    Sign In
                </Link>
            </SignedOut>
            <SignedIn>
                <Link className="text-2xl hover:text-accent" href="/profile">
                    Profile
                </Link>
                <UserButton />
            </SignedIn>
        </nav>
    );
};

export default Nav;
