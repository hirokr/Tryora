"use client";

import { useState } from "react";

import {
  WardrobeGrid,
  WardrobeToolbar,
} from "@/components/utility/experience/WardrobeWorkspace";

import { WARDROBE_ITEMS } from "@/constants/experience";

import { WardrobeHeader } from "./_components/WardrobeHeader";

export default function WardrobePage() {
  const [activeTab, setActiveTab] = useState<"outfits" | "items">("outfits");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <WardrobeHeader />

      <WardrobeToolbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <WardrobeGrid items={WARDROBE_ITEMS} />
    </main>
  );
}
