"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth/clientAuthFetch";

type HistoryItem = {
  id: string;
  prompt?: string;
  createdAt?: string;
};

export function SearchHistoryQuickCard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch("/api/search/history", {
          method: "GET",
        });

        const payload = (await response.json().catch(() => ({}))) as { results?: HistoryItem[] };

        if (!response.ok) {
          setHistory([]);
          return;
        }

        setHistory(payload.results || []);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <article className="rounded-2xl border border-primary/25 bg-[#16131f] p-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Search</p>
          <h3 className="mt-1 text-lg font-semibold">Search history</h3>
          <p className="mt-1 text-sm text-slate-300">Quickly open previous product searches.</p>
        </div>
        <span className="rounded-full border border-primary/35 px-2.5 py-1 text-xs font-semibold text-primary">
          {isLoading ? "..." : history.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {history.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            href={`/search/${item.id}/products`}
            className="block rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-primary/40"
          >
            <p className="line-clamp-1">{item.prompt || "Search"}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/search/history"
        className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
      >
        Open search history
      </Link>
    </article>
  );
}
