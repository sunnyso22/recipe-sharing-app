import Link from "next/link";
import Nav from "./Nav";
import MobileNav from "./MobileNav";

const Header = () => {
    return (
        <header className="w-full py-4 xl:py-6">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link href="/">
                    <h1 className="text-4xl font-semibold italic">Cookery</h1>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8 text-paragraph">
                    <Nav />
                </div>

                {/* Mobile Nav */}
                <div className="lg:hidden">
                    <MobileNav />
                </div>
            </div>
        </header>
    );
};

export default Header;
