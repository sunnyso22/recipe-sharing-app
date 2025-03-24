import Link from "next/link";
import { ChefHat } from "lucide-react";

const Footer = () => {
    return (
        <footer className="w-full mt-12 bg-transparent">
            <div className="py-10 lg:py-14 container mx-auto flex flex-col lg:flex-row gap-3 items-center justify-between ">
                <p className="text-lg text-white">
                    Copyright © 2025, Sunny So. All Rights Reserved.
                </p>
                {/* Logo */}
                <Link href="/">
                    <h1 className="flex items-center gap-1 text-white text-4xl font-semibold italic">
                        Cookery
                        <ChefHat size={36} />
                    </h1>
                </Link>
            </div>
        </footer>
    );
};

export default Footer;
