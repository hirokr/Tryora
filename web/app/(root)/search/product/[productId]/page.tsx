"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth/clientAuthFetch";
import type { SearchProduct } from "@/types/search";

type ProductResponse = {
  message?: string;
  result?: SearchProduct;
  data?: SearchProduct;
};

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;

  const [product, setProduct] = useState<SearchProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metricMessage, setMetricMessage] = useState<string>("");

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const response = await authFetch(`/api/products/${productId}`, { method: "GET" });
        const payload = (await response.json().catch(() => ({}))) as ProductResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load product details");
        }

        setProduct(payload.result || payload.data || (payload as unknown as SearchProduct));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product details");
      }
    };

    void loadProduct();
  }, [productId]);

  const sendMetric = async (action: "VIEW" | "LIKE" | "ORDER") => {
    try {
      const response = await authFetch(`/api/search/product-metric/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to update metric");
      }

      setMetricMessage(`${action} metric sent`);
    } catch {
      setMetricMessage("Metric update failed");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      {product ? (
        <article className="overflow-hidden rounded-2xl border border-primary/20 bg-[#191022] text-white">
          <div className="aspect-[16/9] bg-black/30">
            {product.image ? (
              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="space-y-4 p-6">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-sm text-slate-300">
              {product.brand || "Brand not set"} · {product.category || "Category not set"}
            </p>
            <p className="text-lg font-semibold text-primary">
              {product.price ? `${product.price} ${product.currency || ""}`.trim() : "Price unavailable"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => sendMetric("VIEW")}
                className="rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Track view
              </button>
              <button
                onClick={() => sendMetric("LIKE")}
                className="rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Track like
              </button>
              <button
                onClick={() => sendMetric("ORDER")}
                className="rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Track order
              </button>
              {product.productUrl || product.link ? (
                <a
                  href={product.productUrl || product.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Open store listing
                </a>
              ) : null}
            </div>
            {metricMessage ? <p className="text-sm text-slate-300">{metricMessage}</p> : null}
          </div>
        </article>
      ) : null}
    </main>
  );
}
