import Link from "next/link";
import React from "react";

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

const Nav = () => {
    return (
        <nav className="flex gap-8">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.path}
                    className="font-medium text-2xl"
                >
                    {link.name}
                </Link>
            ))}
        </nav>
    );
};

export default Nav;
