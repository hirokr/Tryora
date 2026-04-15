"use client";

import { useMemo, useState } from "react";

import {
  StylingAvatarPanel,
  StylingEventPanel,
  StylingRecommendationsPanel,
} from "@/components/utility/experience/StylingSessionWorkspace";

import {
  STYLING_AVATAR_BY_CATEGORY,
  STYLING_CATEGORIES,
  STYLING_PRODUCTS,
} from "@/constants/experience";
import type { StylingCategory } from "@/types/experience";

export default function StylingSessionPage() {
  const [activeCategory, setActiveCategory] = useState<StylingCategory>("Avant-Garde");

  const products = useMemo(() => STYLING_PRODUCTS[activeCategory], [activeCategory]);
  const avatarSrc = STYLING_AVATAR_BY_CATEGORY[activeCategory];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <StylingEventPanel />
      <StylingAvatarPanel avatarSrc={avatarSrc} showHotspots={activeCategory === "Avant-Garde"} />
      <StylingRecommendationsPanel
        products={products}
        categories={STYLING_CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={(value) => setActiveCategory(value as StylingCategory)}
      />
    </main>
  );
}
