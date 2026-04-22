"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth/authFetch";

type FavouriteProduct = {
  id: string;
  title: string;
  price: number | string | null;
  defaultImageUrl: string | null;
  likeCount?: number | null;
};

type FavouriteResponse = {
  status?: string;
  results?: FavouriteProduct[];
  message?: string;
};

function formatPrice(price: FavouriteProduct["price"]) {
  if (price === null || price === undefined || price === "") {
    return "Price unavailable";
  }

  return typeof price === "number" ? `$${price.toFixed(2)}` : price;
}

function ProductSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="aspect-[4/3] animate-pulse bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </article>
  );
}

function ProductCard({ product }: { product: FavouriteProduct }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#151124] shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-black/30">
        {product.defaultImageUrl ? (
          <img
            src={product.defaultImageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12))] text-sm text-slate-300">
            No image available
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-100">
            Favourite
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{product.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{formatPrice(product.price)}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
            <span className="text-slate-200">Likes</span>
            <strong className="text-white">{product.likeCount ?? 0}</strong>
          </span>
          <Link
            href={`/discover/${product.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 font-medium text-cyan-100 transition hover:bg-cyan-300/10"
          >
            View product
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function FavouritePage() {
  const [products, setProducts] = useState<FavouriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setError(null);

    try {
      const response = await authFetch("/api/user/get-favorites?limit=24&skip=0", {
        method: "GET",
      });

      const payload = (await response.json().catch(() => ({}))) as FavouriteResponse;
      const results = Array.isArray(payload.results) ? payload.results : [];

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load favourite products.");
      }

      setProducts(results);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load favourite products.");
      setProducts([]);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await loadProducts();
      setIsLoading(false);
    };

    void initialLoad();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
  };

  const isEmpty = !isLoading && !error && products.length === 0;

  return (
    <main className="min-h-screen bg-[#0f0a1b] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,#171126_0%,#0f0a1b_100%)] pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-100">
                Saved collection
              </div>
              <div>
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Your favourite products</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  A curated view of the items you marked as favourites. Review them quickly, jump back into product details, or continue exploring from Discover.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Items saved</p>
                <p className="mt-2 text-3xl font-semibold">{products.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Quick actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/discover" className="rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/10">
                    Explore
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing}
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

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">Nothing here yet</p>
            <h2 className="mt-3 text-3xl font-semibold">No favourite products saved</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              When you favourite products from Discover, they will appear here for quick access. Until then, browse new items and save the ones you like.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/discover" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
                Go to Discover
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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
