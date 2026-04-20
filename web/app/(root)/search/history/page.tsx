"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";

type HistoryItem = {
  id: string;
  prompt?: string;
  intentKey?: string;
  status?: string;
  createdAt?: string;
};

type HistoryResponse = {
  message?: string;
  results?: HistoryItem[];
};

export default function SearchHistoryPage() {
  const [results, setResults] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/search/history`, {
          method: "GET",
          credentials: "include",
        });
        const payload = (await response.json().catch(() => ({}))) as HistoryResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load history");
        }

        setResults(payload.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      }
    };

    void loadHistory();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">History</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Recent searches</h1>
      </div>
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <div className="space-y-3">
        {results.map((item) => (
          <article key={item.id} className="rounded-xl border border-primary/20 bg-[#191022] p-4 text-white">
            <p className="text-sm text-slate-300">{item.prompt || item.intentKey || "Search"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Status: {item.status || "unknown"}</span>
              <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
            </div>
            <Link href={`/search/${item.id}/products`} className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
              View products
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
