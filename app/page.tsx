import Hero from "@/components/Hero";
import HotRecipes from "@/components/HotRecipes";

export default function Home() {
    return (
        <main className="container mx-auto">
            {/* Hero section */}
            <Hero />
            {/* Hot recipes */}
            <HotRecipes />
            {/* category? */}
        </main>
    );
}
