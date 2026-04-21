"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  StyleDiscoveryContent,
  StyleDiscoveryInspirationGrid,
} from "@/components/utility/experience/StyleDiscoveryWorkspace";
import {
  SEARCH_RECOMMENDATIONS_STORAGE_KEY,
  STYLE_DISCOVERY_AESTHETIC_STORAGE_KEY,
  STYLE_DISCOVERY_PROMPT_STORAGE_KEY,
} from "@/constants/flow";

import { useStyleDiscovery } from "@/hooks";
import type { SearchResponse } from "@/types/search";

import { StyleDiscoveryHero } from "./_components/StyleDiscoveryHero";

export default function StyleDiscoveryPage() {
  const router = useRouter();
  const { selectedAesthetic, setSelectedAesthetic } = useStyleDiscovery();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertPreferences = async (styleTags: string[]) => {
    const payload = {
      age: 25,
      ethnicity: "unspecified",
      gender: "unspecified",
      location: "",
      preferredColors: [],
      styleTags,
      notificationPrefs: true,
    };

    const profileResponse = await fetch("/api/profile/profile", { method: "GET" });
    const method = profileResponse.ok ? "PUT" : "POST";

    await fetch("/api/profile/preferences", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  };

  const handleGenerateRecommendations = async () => {
    setError(null);

    const styleTags = selectedAesthetic ? [selectedAesthetic] : [];
    const finalPrompt = [prompt.trim(), selectedAesthetic ? `Style: ${selectedAesthetic}` : ""]
      .filter(Boolean)
      .join(" | ");

    if (!finalPrompt) {
      setError("Add a prompt or select a style aesthetic.");
      return;
    }

    setIsGenerating(true);

    try {
      await upsertPreferences(styleTags);

      const searchResponse = await fetch("/api/search/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput: finalPrompt }),
      });

      const payload = (await searchResponse.json().catch(() => ({}))) as SearchResponse;

      if (!searchResponse.ok) {
        throw new Error(payload.message || "Failed to generate recommendations");
      }

      localStorage.setItem(STYLE_DISCOVERY_PROMPT_STORAGE_KEY, prompt);
      localStorage.setItem(STYLE_DISCOVERY_AESTHETIC_STORAGE_KEY, selectedAesthetic || "");
      localStorage.setItem(
        SEARCH_RECOMMENDATIONS_STORAGE_KEY,
        JSON.stringify(payload.results || []),
      );

      router.push("/styling-session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <StyleDiscoveryHero />

      <StyleDiscoveryContent
        selectedAesthetic={selectedAesthetic}
        setSelectedAesthetic={setSelectedAesthetic}
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerateRecommendations={handleGenerateRecommendations}
        isGenerating={isGenerating}
        error={error}
      />
      <StyleDiscoveryInspirationGrid />
    </main>
  );
}
// End of file