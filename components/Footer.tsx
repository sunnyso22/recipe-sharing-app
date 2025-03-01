import React from "react";
import Link from "next/link";

const Footer = () => {
    return (
        <footer className="w-full mt-12 bg-black">
            <div className="py-6 xl:py-14 container mx-auto flex justify-between items-center">
                <p className="text-lg text-white">
                    Copyright © 2025, Sunny So. All Rights Reserved.
                </p>
                {/* Logo */}
                <Link href="/">
                    <h1 className="text-white text-4xl font-semibold italic">
                        Cookery
                    </h1>
                </Link>
            </div>
        </footer>
    );
};

export default Footer;
