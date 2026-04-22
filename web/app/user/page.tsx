import { AiSceneGenerationSection } from "./_components/home/AiSceneGenerationSection";
import { BrandTickerSection } from "./_components/home/BrandTickerSection";
import { DistributedWardrobeSection } from "./_components/home/DistributedWardrobeSection";
import { FinalCtaSection } from "./_components/home/FinalCtaSection";
import { ForBrandsSection } from "./_components/home/ForBrandsSection";
import { HeroSection } from "./_components/home/HeroSection";
import { TryOnSection } from "./_components/home/TryOnSection";
import { getSession } from "@/lib/auth/session";

const brands = ["Gucci", "Prada", "Balenciaga", "Off-White", "Dior", "Versace", "Saint Laurent", "Fendi"];

const distributedWardrobeCards = [
  { icon: "public", title: "Universal Access", desc: "Your clothes follow you everywhere. Seamless integration with major gaming engines." },
  { icon: "shield_lock", title: "Blockchain Secured", desc: "Ownership verified on the distributed ledger. True digital scarcity and proof of origin." },
  { icon: "sync", title: "Cloud Syncing", desc: "Instantly update your style across all connected accounts and virtual spaces." },
];

const forBrandsCards = [
  { icon: "integration_instructions", title: "Seamless Integration", desc: "One-click SDK for existing e-commerce platforms like Shopify, Magento, and custom builds." },
  { icon: "monitoring", title: "Insightful Analytics", desc: "Track virtual engagement, try-on rates, and customer body data trends in real-time." },
  { icon: "language", title: "Global Scalability", desc: "Deploy your digital collection across web, mobile, and the metaverse with a single asset pipeline." },
];

export default async function Home() {
	const session = await getSession();
	const createAvatarHref = session?.user ? "/update-pics" : "/auth/signup";

	return (
		<main className="flex-1">
  <HeroSection />
  <BrandTickerSection brands={brands} />
  <TryOnSection />
  <DistributedWardrobeSection cards={distributedWardrobeCards} />
  <AiSceneGenerationSection />
  <ForBrandsSection cards={forBrandsCards} />
  <FinalCtaSection createAvatarHref={createAvatarHref} />

      </main>
	);
}
