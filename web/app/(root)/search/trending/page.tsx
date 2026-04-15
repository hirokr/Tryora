"use client";

import { useEffect, useState } from "react";

import { SearchProductCard } from "@/components/utility/search/SearchProductCard";
import type { SearchResponse } from "@/types/search";

export default function TrendingSearchPage() {
  const [results, setResults] = useState<SearchResponse["results"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const response = await fetch("/api/search/trending", { method: "GET" });
        const payload = (await response.json().catch(() => ({}))) as SearchResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load trending products");
        }

        setResults(payload.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trending products");
      }
    };

    void loadTrending();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Trending</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Top trending products</h1>
      </div>
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results?.map((product, index) => (
          <SearchProductCard key={product.id || `${product.title}-${index}`} product={product} />
        ))}
      </section>
    </main>
  );
}
