"use client";

import { useEffect, useMemo, useState } from "react";

import {
  WardrobeGrid,
  WardrobeToolbar,
} from "@/components/utility/experience/WardrobeWorkspace";
import { BACKEND_URL } from "@/constants/constants";
import {
  TRYON_RESULT_STORAGE_KEY,
  TRYON_RESULT_STORAGE_KEY_ALT,
  TRYON_RESULT_STORAGE_KEY_AVATAR,
} from "@/constants/flow";
import type { WardrobeItem } from "@/types/experience";

import { WardrobeHeader } from "./WardrobeHeader";

type TryonRecord = {
  id: string;
  resultUrl?: string;
  productIds?: string[];
  tryonType?: string;
  isFavorite?: boolean;
};

type ProductDetails = {
  id: string;
  title?: string;
  category?: string;
  defaultImageUrl?: string;
};

type WardrobePageClientProps = {
  userId: string | null;
};

const FALLBACK_IMAGE = "/wardrobe/wardrobe%201.png";

function normalizeTryonCollection(payload: unknown): TryonRecord[] {
  if (Array.isArray(payload)) {
    return payload as TryonRecord[];
  }

  const source = (payload || {}) as Record<string, unknown>;
  if (Array.isArray(source.data)) {
    return source.data as TryonRecord[];
  }

  if (Array.isArray(source.results)) {
    return source.results as TryonRecord[];
  }

  return [];
}

function normalizeTryonItem(payload: unknown): TryonRecord | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.id === "string") {
    return record as TryonRecord;
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (typeof nested.id === "string") {
      return nested as TryonRecord;
    }
  }

  return null;
}

function normalizeProduct(payload: unknown): ProductDetails | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.id === "string") {
    return record as ProductDetails;
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (typeof nested.id === "string") {
      return nested as ProductDetails;
    }
  }

  if (record.result && typeof record.result === "object") {
    const nested = record.result as Record<string, unknown>;
    if (typeof nested.id === "string") {
      return nested as ProductDetails;
    }
  }

  return null;
}

export default function WardrobePageClient({ userId }: WardrobePageClientProps) {
  const [activeTab, setActiveTab] = useState<"favourite" | "tryon">("favourite");
  const [activeCategories, setActiveCategories] = useState<
    Array<"All" | "Cloth" | "Accessaries" | "Shoes" | "Other">
  >(["All"]);
  const [tryOnItems, setTryOnItems] = useState<WardrobeItem[]>([]);
  const [favouriteItems, setFavouriteItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (category: "All" | "Cloth" | "Accessaries" | "Shoes" | "Other") => {
    setActiveCategories((current) => {
      if (category === "All") {
        return ["All"];
      }

      const withoutAll = current.filter((item) => item !== "All");
      const exists = withoutAll.includes(category);
      const next = exists ? withoutAll.filter((item) => item !== category) : [...withoutAll, category];

      return next.length > 0 ? next : ["All"];
    });
  };

  useEffect(() => {
    const fetchWardrobeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!userId) {
          throw new Error("User ID was not found.");
        }

        const userTryonsResponse = await fetch(`${BACKEND_URL}/api/tryon/user/${userId}`, {
          method: "GET",
          credentials: "include",
        });

        let tryonSeeds: TryonRecord[] = [];

        if (userTryonsResponse.ok) {
          const tryonCollectionPayload = await userTryonsResponse.json().catch(() => ({}));
          tryonSeeds = normalizeTryonCollection(tryonCollectionPayload);
        }

        const fallbackTryonIds = [
          localStorage.getItem(TRYON_RESULT_STORAGE_KEY),
          localStorage.getItem(TRYON_RESULT_STORAGE_KEY_ALT),
          localStorage.getItem(TRYON_RESULT_STORAGE_KEY_AVATAR),
        ]
          .filter((value): value is string => Boolean(value && value.trim()))
          .map((value) => value.trim());

        const seedIds = new Set<string>([
          ...tryonSeeds.map((item) => item.id).filter(Boolean),
          ...fallbackTryonIds,
        ]);

        if (!seedIds.size) {
          setTryOnItems([]);
          setFavouriteItems([]);
          return;
        }

        const tryonDetails = (
          await Promise.all(
            Array.from(seedIds).map(async (tryonId) => {
              const response = await fetch(`${BACKEND_URL}/api/tryon/item/${tryonId}`, {
                method: "GET",
                credentials: "include",
              });

              if (!response.ok) return null;
              const payload = await response.json().catch(() => ({}));
              return normalizeTryonItem(payload);
            }),
          )
        ).filter((item): item is TryonRecord => Boolean(item));

        if (!tryonDetails.length) {
          setTryOnItems([]);
          setFavouriteItems([]);
          return;
        }

        const allProductIds = Array.from(
          new Set(
            tryonDetails.flatMap((item) =>
              Array.isArray(item.productIds) ? item.productIds.filter(Boolean) : [],
            ),
          ),
        );

        const productMap = new Map<string, ProductDetails>();
        await Promise.all(
          allProductIds.map(async (productId) => {
            const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
              method: "GET",
              credentials: "include",
            });

            if (!response.ok) return;
            const payload = await response.json().catch(() => ({}));
            const product = normalizeProduct(payload);
            if (product?.id) {
              productMap.set(product.id, product);
            }
          }),
        );

        let itemId = 1;
        const resolvedTryOnItems: WardrobeItem[] = tryonDetails.flatMap((tryon) => {
          const productIds = Array.isArray(tryon.productIds) ? tryon.productIds : [];

          if (!productIds.length) {
            return [
              {
                id: itemId++,
                name: `Try-on ${tryon.id.slice(0, 8)}`,
                category: `Try-on • ${tryon.tryonType || "Unknown"}`,
                badge: tryon.isFavorite ? "Favourite" : "Try On",
                badgeStyle: tryon.isFavorite ? "primary" : "muted",
                img: tryon.resultUrl || FALLBACK_IMAGE,
                alt: `Try-on result ${tryon.id}`,
                liked: Boolean(tryon.isFavorite),
              },
            ];
          }

          return productIds.map((productId) => {
            const product = productMap.get(productId);

            return {
              id: itemId++,
              name: product?.title || `Product ${productId.slice(0, 8)}`,
              category: `${product?.category || "Product"} • ${tryon.tryonType || "Try-on"}`,
              badge: tryon.isFavorite ? "Favourite" : "Try On",
              badgeStyle: tryon.isFavorite ? "primary" : "muted",
              img: product?.defaultImageUrl || tryon.resultUrl || FALLBACK_IMAGE,
              alt: product?.title || `Try-on product ${productId}`,
              liked: Boolean(tryon.isFavorite),
            };
          });
        });

        setTryOnItems(resolvedTryOnItems);
        setFavouriteItems(resolvedTryOnItems.filter((item) => item.liked));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load wardrobe data.");
        setTryOnItems([]);
        setFavouriteItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWardrobeData();
  }, [userId]);

  const activeItems = useMemo(() => {
    const baseItems = activeTab === "favourite" ? favouriteItems : tryOnItems;
    const clothingRegex = /cloth|shirt|pant|trouser|dress|kurti|saree|jacket|top|wear|hoodie|jeans|skirt/i;
    const shoesRegex = /shoe|footwear|sneaker|boot|sandal/i;
    const accessariesRegex = /accessor|jewel|watch|bag|belt|scarf/i;

    if (activeCategories.includes("All") || activeCategories.length === 0) {
      return baseItems;
    }

    return baseItems.filter((item) => {
      const inCloth = clothingRegex.test(item.category);
      const inShoes = shoesRegex.test(item.category);
      const inAccessaries = accessariesRegex.test(item.category);
      const inOther = !inCloth && !inShoes && !inAccessaries;

      return (
        (activeCategories.includes("Cloth") && inCloth) ||
        (activeCategories.includes("Shoes") && inShoes) ||
        (activeCategories.includes("Accessaries") && inAccessaries) ||
        (activeCategories.includes("Other") && inOther)
      );
    });
  }, [activeCategories, activeTab, favouriteItems, tryOnItems]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <WardrobeHeader />

      <WardrobeToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCategories={activeCategories}
        onCategoryToggle={toggleCategory}
      />

      {isLoading ? <p className="text-sm text-slate-300">Loading wardrobe...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!isLoading && !error && activeItems.length === 0 ? (
        <p className="text-sm text-slate-400">
          {activeTab === "favourite"
            ? "No favourite products found yet."
            : "No try-on products found yet."}
        </p>
      ) : null}

      {!isLoading && !error && activeItems.length > 0 ? <WardrobeGrid items={activeItems} /> : null}
    </main>
  );
}
