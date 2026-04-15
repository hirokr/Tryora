"use client";

import Image from "next/image";

import {
  STYLE_DISCOVERY_AESTHETICS,
  STYLE_DISCOVERY_GRID_IMAGES,
} from "@/constants/experience";

type StyleDiscoveryContentProps = {
  selectedAesthetic: string | null;
  setSelectedAesthetic: (value: string | null) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerateRecommendations: () => void;
  isGenerating: boolean;
  error: string | null;
};

export function StyleDiscoveryContent({
  selectedAesthetic,
  setSelectedAesthetic,
  prompt,
  setPrompt,
  onGenerateRecommendations,
  isGenerating,
  error,
}: StyleDiscoveryContentProps) {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-white/5 p-4 backdrop-blur-md sm:p-6">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-28 w-full resize-none rounded-xl border border-primary/20 bg-background-dark px-4 py-3 text-base text-white outline-none focus:border-primary sm:text-lg"
          placeholder="e.g., Summer Wedding in Tuscany or Tech Conference Keynote in San Francisco"
        />
      </div>

      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Or choose a style aesthetic
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {STYLE_DISCOVERY_AESTHETICS.map((tag) => {
            const active = selectedAesthetic === tag.label;

            return (
              <button
                key={tag.label}
                onClick={() => setSelectedAesthetic(active ? null : tag.label)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all sm:text-base ${
                  active
                    ? "border border-primary bg-primary/15 text-primary"
                    : "border border-primary/30 bg-primary/5 text-slate-300 hover:border-primary"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 pt-2">
        <button
          onClick={onGenerateRecommendations}
          disabled={isGenerating || (!prompt.trim() && !selectedAesthetic)}
          className="inline-flex min-w-72 items-center justify-center gap-2 rounded-full bg-primary px-9 py-4 text-base font-bold text-white transition-all hover:bg-primary/90"
        >
          <span>{isGenerating ? "Generating..." : "Generate Recommendations"}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button className="text-sm font-medium text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-200">
          Skip for now, I&apos;ll browse collections
        </button>
      </div>
    </section>
  );
}

export function StyleDiscoveryInspirationGrid() {
  return (
    <section className="mt-14 grid grid-cols-2 gap-3 opacity-40 sm:grid-cols-4 sm:gap-4">
      {STYLE_DISCOVERY_GRID_IMAGES.map((src, i) => (
        <div
          key={src}
          className={`relative aspect-[3/4] overflow-hidden rounded-xl ${i % 2 === 1 ? "sm:translate-y-6" : ""}`}
        >
          <Image src={src} alt="Fashion inspiration" fill className="object-cover" />
        </div>
      ))}
    </section>
  );
}
