"use client";

import {
  StyleDiscoveryContent,
  StyleDiscoveryInspirationGrid,
} from "@/components/utility/experience/StyleDiscoveryWorkspace";

import { useStyleDiscovery } from "@/hooks";

import { StyleDiscoveryHero } from "./_components/StyleDiscoveryHero";

export default function StyleDiscoveryPage() {
  const { selectedAesthetic, setSelectedAesthetic } = useStyleDiscovery();

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <StyleDiscoveryHero />

      <StyleDiscoveryContent
        selectedAesthetic={selectedAesthetic}
        setSelectedAesthetic={setSelectedAesthetic}
      />
      <StyleDiscoveryInspirationGrid />
    </main>
  );
}
