"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchProductCard } from "@/components/utility/search/SearchProductCard";
import type { SearchResponse } from "@/types/search";

export default function SearchPage() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string>("");
  const [searchId, setSearchId] = useState<string | undefined>();
  const [results, setResults] = useState<SearchResponse["results"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: prompt }),
      });

      const payload = (await response.json().catch(() => ({}))) as SearchResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Search failed");
      }

      setStatus(payload.status || "");
      setSearchId(payload.searchId || payload.results?.[0]?.searchId);
      setResults(payload.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
      setSearchId(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuerySearch = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search/search-by-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });

      const payload = (await response.json().catch(() => ({}))) as SearchResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Search by query failed");
      }

      setStatus(payload.status || "");
      setSearchId(payload.searchId || payload.results?.[0]?.searchId);
      setResults(payload.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search by query failed");
      setResults([]);
      setSearchId(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white shadow-lg shadow-black/20 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">AI Search</p>
        <h1 className="mt-2 text-3xl font-bold">Find styles instantly</h1>
        <p className="mt-2 text-sm text-slate-300">
          Search products by intent, view trending picks, and inspect your history.
        </p>

        <div className="mt-6 space-y-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Try: modern black cocktail dress under 150"
            className="min-h-28 w-full rounded-xl border border-primary/20 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runSearch}
              disabled={isLoading || !prompt.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Searching..." : "Run AI Search"}
            </button>
            <button
              onClick={runQuerySearch}
              disabled={isLoading || !prompt.trim()}
              className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search by query
            </button>
            <Link href="/search/trending" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-primary">
              Trending
            </Link>
            <Link href="/search/history" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-primary">
              History
            </Link>
          </div>
        </div>

        {status ? (
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">Status: {status}</p>
        ) : null}
        {searchId ? (
          <Link href={`/search/${searchId}/products`} className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline">
            View all products for search {searchId}
          </Link>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results?.map((product, index) => (
          <SearchProductCard key={product.id || `${product.title}-${index}`} product={product} />
        ))}
      </section>
    </main>
  );
}
