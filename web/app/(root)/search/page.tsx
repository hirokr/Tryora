"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";
import type { SearchResponse } from "@/types/search";

type FilterState = {
  category: string;
  color: string;
  minBudget: string;
  maxBudget: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  country: string;
};

export default function SearchPage() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string>("");
  const [searchId, setSearchId] = useState<string | undefined>();
  const [results, setResults] = useState<SearchResponse["results"]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    color: "",
    minBudget: "",
    maxBudget: "",
  });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allProducts = useMemo(() => results || [], [results]);

  const seedMetrics = useCallback((products: NonNullable<SearchResponse["results"]>) => {
    setLikeCounts((previous) => {
      const next = { ...previous };
      for (const product of products) {
        if (!product.id) continue;
        if (typeof next[product.id] === "undefined") {
          next[product.id] = Math.max(0, Math.round(product.trendingScore || 0));
        }
      }
      return next;
    });

    setViewCounts((previous) => {
      const next = { ...previous };
      for (const product of products) {
        if (!product.id) continue;
        if (typeof next[product.id] === "undefined") {
          next[product.id] = 0;
        }
      }
      return next;
    });
  }, []);

  const updateProductMetric = useCallback(async (productId: string, action: "VIEW" | "LIKE" | "CLICK") => {
    const endpoint = `${BACKEND_URL}/api/search/product-metric/${productId}`;
    const body = JSON.stringify({ action });

    let response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body,
    });

    if (response.status === 404 || response.status === 405) {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
    }

    return response.ok;
  }, []);

  const resolveCountry = async (latitude: number, longitude: number) => {
    const geoResponse = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { method: "GET" },
    );
    if (!geoResponse.ok) return "";
    const payload = (await geoResponse.json().catch(() => ({}))) as { countryName?: string };
    return payload.countryName || "";
  };

  const detectUserLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not available in this browser.");
      return;
    }

    setIsResolvingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const country = await resolveCountry(latitude, longitude);

        setUserLocation({ latitude, longitude, country });
        setIsResolvingLocation(false);
      },
      (positionError) => {
        setLocationError(positionError.message || "Unable to fetch location.");
        setIsResolvingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const runSearch = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/search/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userInput: prompt,
          location: userLocation,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as SearchResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Search failed");
      }

      setStatus(payload.status || "");
      setSearchId(payload.searchId || payload.results?.[0]?.searchId);
      setResults(payload.results || []);
      seedMetrics(payload.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
      setSearchId(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const runFilteredSearch = async () => {
    if (!prompt.trim() && !filters.category.trim() && !filters.color.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/search/search-filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userInput: prompt,
          query: prompt,
          category: filters.category || undefined,
          color: filters.color || undefined,
          budget: {
            min: filters.minBudget ? Number(filters.minBudget) : undefined,
            max: filters.maxBudget ? Number(filters.maxBudget) : undefined,
          },
          location: userLocation,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as SearchResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Structured search failed");
      }

      setStatus(payload.status || "");
      setSearchId(payload.searchId || payload.results?.[0]?.searchId);
      setResults(payload.results || []);
      seedMetrics(payload.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Structured search failed");
      setResults([]);
      setSearchId(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (productId: string) => {
    setLikeCounts((previous) => ({ ...previous, [productId]: (previous[productId] || 0) + 1 }));
    void updateProductMetric(productId, "LIKE");
  };

  const handleViewed = async (productId: string) => {
    setViewCounts((previous) => ({ ...previous, [productId]: (previous[productId] || 0) + 1 }));
    void updateProductMetric(productId, "VIEW");
  };

  useEffect(() => {
    seedMetrics(allProducts);
  }, [allProducts, seedMetrics]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-32 pt-24 sm:px-6 sm:pb-36 lg:px-8">
      <section className="rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white shadow-lg shadow-black/20 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">AI Search</p>
          <h1 className="mt-2 text-3xl font-bold">Find styles instantly</h1>
          <p className="mt-2 text-sm text-slate-300">
            Search with prompt + your location for better local recommendations.
          </p>

          <div className="mt-6 space-y-3">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Try: modern black cocktail dress under 150"
              className="min-h-40 w-full rounded-xl border border-primary/20 bg-black/20 px-4 py-4 text-base text-white outline-none focus:border-primary"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runSearch}
                disabled={isLoading || !prompt.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Searching..." : "Run AI Search"}
              </button>

              <button
                type="button"
                onClick={detectUserLocation}
                disabled={isResolvingLocation}
                className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolvingLocation ? "Detecting location..." : "Use my location"}
              </button>

              <Link
                href="/search/trending"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-primary"
              >
                Trending
              </Link>

              <button
                type="button"
                onClick={() => setFiltersExpanded((previous) => !previous)}
                className={`rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-all ${
                  filtersExpanded ? "bg-primary/10" : ""
                }`}
              >
                Advance Filter
              </button>
            </div>

            {filtersExpanded ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                <div className="flex flex-wrap gap-3 lg:flex-nowrap">
                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs uppercase text-slate-300">Category</label>
                    <input
                      value={filters.category}
                      onChange={(event) =>
                        setFilters((previous) => ({ ...previous, category: event.target.value }))
                      }
                      placeholder="Jackets"
                      className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs uppercase text-slate-300">Color</label>
                    <input
                      value={filters.color}
                      onChange={(event) =>
                        setFilters((previous) => ({ ...previous, color: event.target.value }))
                      }
                      placeholder="Black"
                      className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs uppercase text-slate-300">Min Budget</label>
                    <input
                      value={filters.minBudget}
                      onChange={(event) =>
                        setFilters((previous) => ({ ...previous, minBudget: event.target.value }))
                      }
                      type="number"
                      min={0}
                      placeholder="50"
                      className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs uppercase text-slate-300">Max Budget</label>
                    <input
                      value={filters.maxBudget}
                      onChange={(event) =>
                        setFilters((previous) => ({ ...previous, maxBudget: event.target.value }))
                      }
                      type="number"
                      min={0}
                      placeholder="250"
                      className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="min-w-[140px] self-end lg:w-auto">
                    <button
                      type="button"
                      onClick={runFilteredSearch}
                      disabled={isLoading}
                      className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? "Filtering..." : "Apply filter"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {userLocation ? (
            <p className="mt-3 text-xs text-emerald-300">
              Location: {userLocation.country || "Unknown country"} ({userLocation.latitude.toFixed(3)},{" "}
              {userLocation.longitude.toFixed(3)})
            </p>
          ) : null}
          {locationError ? <p className="mt-3 text-xs text-red-300">{locationError}</p> : null}

          {status ? (
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">Status: {status}</p>
          ) : null}
          {searchId ? (
            <Link
              href={`/search/${searchId}/products`}
              className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              View all products for search {searchId}
            </Link>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      </section>
    </main>
  );
}
