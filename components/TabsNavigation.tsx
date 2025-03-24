import Link from "next/link";
import { Button } from "./ui/button";

const tabs = [
    { id: "My Recipes", label: "My Recipes" },
    { id: "Bookmarks", label: "Bookmarks" },
];

const TabsNavigation = ({ activeTab }: { activeTab: string }) => {
    return (
        <div className="flex justify-center md:justify-start gap-6 py-6">
            {tabs.map((tab) => (
                <Link key={tab.id} href={`?tab=${tab.id}`}>
                    <Button
                        variant={`${
                            activeTab === tab.id ? "default" : "outline"
                        }`}
                    >
                        {tab.label}
                    </Button>
                </Link>
            ))}
        </div>
    );
};

export default TabsNavigation;
