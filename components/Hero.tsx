import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Hero = () => {
    return (
        <div className="h-[70vh] flex flex-col justify-center items-center">
            <div className="text-center">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6">
                    Discover, Share, and Savor
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-300">
                        {" "}
                        the World's Best Recipes
                    </div>
                </h1>
                <p className="text-gray-400 text-2xl md:text-3xl mb-8">
                    Your Culinary Adventure Starts Here!
                </p>
            </div>
            <div className="flex gap-3">
                <Input type="text" placeholder="Anything want to cook today?" />
                <Button className="flex gap-2">
                    <Search />
                    Search
                </Button>
            </div>
        </div>
    );
};

export default Hero;
