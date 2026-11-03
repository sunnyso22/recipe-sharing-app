import { HomeHero } from "@/components/home/hero";
import { HomeHighlights } from "@/components/home/highlights";

const Home = () => {
  return (
    <main className="flex flex-1 flex-col">
      <HomeHero />
      <HomeHighlights />
    </main>
  );
};

export default Home;
