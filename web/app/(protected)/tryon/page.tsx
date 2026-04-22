"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/authFetch";

type TryonRecord = {
  id: string;
  userId?: string;
  resultUrl?: string | null;
  productIds?: string[];
  tryonType?: string;
  provider?: string | null;
  createdAt?: string;
};

type TryonListResponse = {
  status?: string;
  results?: number;
  data?: TryonRecord[];
  message?: string;
};

function formatDate(value?: string) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatType(value?: string) {
  if (!value) return "Try-on";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TryonSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="aspect-[4/3] animate-pulse bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </article>
  );
}

function TryonCard({ item }: { item: TryonRecord }) {
  return (
    <Link
      href={`/tryon/${item.id}`}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-[#151124] shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_28px_80px_rgba(0,0,0,0.34)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/30">
        {item.resultUrl ? (
          <Image
            src={item.resultUrl}
            alt={item.tryonType ? formatType(item.tryonType) : "Try-on result"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12))] text-sm text-slate-300">
            No image available
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-100">
              {formatType(item.tryonType)}
            </span>
            {item.provider ? (
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-100">
                {item.provider}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{formatDate(item.createdAt)}</h3>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="rounded-full bg-white/5 px-3 py-1">
            {item.productIds?.length ?? 0} product{(item.productIds?.length ?? 0) === 1 ? "" : "s"}
          </span>
          <span className="text-cyan-100 transition group-hover:translate-x-0.5">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TryonHistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<TryonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || "";
  const totalItems = useMemo(() => items.length, [items]);

  const loadItems = async () => {
    if (!userId) {
      setItems([]);
      return;
    }

    setError(null);

    try {
      const response = await authFetch(`/api/tryon/user/${userId}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as TryonListResponse;
      const records = Array.isArray(payload.data) ? payload.data : [];

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load try-on history.");
      }

      setItems(records);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load try-on history.");
      setItems([]);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      await loadItems();
      setIsLoading(false);
    };

    void initialLoad();
  }, [isAuthLoading, userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const isEmpty = !isLoading && !error && totalItems === 0;

  return (
    <main className="min-h-screen bg-[#0f0a1b] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,#171126_0%,#0f0a1b_100%)] pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-100">
                Your try-on history
              </div>
              <div>
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Every try-on you created</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Browse all of your saved try-ons in one place. Each card opens a detailed view with the stored result, metadata, and linked products.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Try-ons saved</p>
                <p className="mt-2 text-3xl font-semibold">{totalItems}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Quick actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/tryon/image" className="rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/10">
                    New try-on
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing || isAuthLoading}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading || isAuthLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <TryonSkeleton key={index} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">Nothing here yet</p>
            <h2 className="mt-3 text-3xl font-semibold">No try-ons saved</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              When you generate try-ons, they will appear here with their preview image and details. Start a new one to build your history.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/tryon/image" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
                Start a try-on
              </Link>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <TryonCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
