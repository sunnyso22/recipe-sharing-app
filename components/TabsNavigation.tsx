import { Button } from "./ui/button";
import Link from "next/link";

const tabs = [
    { id: "Your Recipes", label: "Your Recipes" },
    { id: "Bookmarks", label: "Bookmarks" },
];

const TabsNavigation = ({ activeTab }: { activeTab: string }) => {
    return (
        <div className="flex gap-6 py-6">
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
