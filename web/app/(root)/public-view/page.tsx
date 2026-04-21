"use client";

import { useEffect, useState } from "react";

import {
  normalizeProduct,
  resolveJobId,
  resolveTryonId,
} from "@/components/utility/avatar/public-view/PublicViewhelpers";
import { PublicViewHeroImage } from "@/components/utility/avatar/public-view/PublicViewHeroImage";
import { PublicViewSidebar } from "@/components/utility/avatar/public-view/PublicViewSidebar";
import { authFetch } from "@/lib/auth/clientAuthFetch";
import type {
  JobStatusResponse,
  ProductResponse,
  SidebarProduct,
  TryonItemResponse,
} from "@/types/publicView";

export default function PublicViewPage() {
  const [resultImageUrl, setResultImageUrl] = useState<string>("/avatar/avatar_result1.png");
  const [imageError, setImageError] = useState<string | null>(null);
  const [products, setProducts] = useState<SidebarProduct[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  useEffect(() => {
    const loadPublicViewImage = async () => {
      setImageError(null);
      const jobId = resolveJobId();
      if (!jobId) {
        setImageError("No job ID found for public view image.");
        return;
      }

      try {
        const response = await authFetch(`/api/tryon/jobs/${jobId}`, {
          method: "GET",
        });

        if (!response.ok) {
          setImageError(`Failed to load image (${response.status}).`);
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as JobStatusResponse;
        const nextImage =
          payload.data?.tryonData?.resultUrl ||
          payload.data?.outputresultUrl ||
          payload.data?.outputResultUrl;

        if (nextImage) {
          setResultImageUrl(nextImage);
          return;
        }

        setImageError("Image URL was not found in job response.");
      } catch {
        setImageError("Failed to load image from try-on job API.");
      }
    };

    void loadPublicViewImage();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setProductsError(null);
      setIsProductsLoading(true);

      try {
        const tryonId = resolveTryonId();
        if (!tryonId) {
          setProducts([]);
          setProductsError("No try-on ID found for sidebar products.");
          return;
        }

        const tryonResponse = await authFetch(`/api/tryon/item/${tryonId}`, {
          method: "GET",
        });

        if (!tryonResponse.ok) {
          setProducts([]);
          setProductsError(`Failed to load try-on details (${tryonResponse.status}).`);
          return;
        }

        const tryonPayload = (await tryonResponse.json().catch(() => ({}))) as TryonItemResponse;
        const productIds = Array.isArray(tryonPayload.productIds)
          ? tryonPayload.productIds
          : Array.isArray(tryonPayload.data?.productIds)
            ? tryonPayload.data.productIds
            : [];

        if (productIds.length === 0) {
          setProducts([]);
          setProductsError("No products were found for this try-on.");
          return;
        }

        const productPayloads = await Promise.all(
          productIds.map(async (productId) => {
            const response = await authFetch(`/api/products/${productId}`, {
              method: "GET",
            });

            if (!response.ok) {
              return null;
            }

            const payload = await response.json().catch(() => ({}));
            return normalizeProduct(payload);
          }),
        );

        const nextProducts = productPayloads
          .filter((item): item is ProductResponse => Boolean(item?.id))
          .map((item) => ({
            id: item.id as string,
            name: item.title || "Unnamed product",
            price:
              typeof item.price === "number"
                ? `BDT ${item.price.toLocaleString()}`
                : item.price || "Price unavailable",
            img: item.defaultImageUrl || "/wardrobe/wardrobe%201.png",
          }));

        if (nextProducts.length > 0) {
          setProducts(nextProducts);
          return;
        }

        setProducts([]);
        setProductsError("No product details were returned for this try-on.");
      } catch {
        setProducts([]);
        setProductsError("Failed to load sidebar products.");
      } finally {
        setIsProductsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden pt-20 font-display text-slate-100"
      style={{
        backgroundColor: "#191022",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(140,43,238,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(140,43,238,0.1) 0px, transparent 50%)",
      }}
    >
      <main className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        <PublicViewHeroImage imageUrl={resultImageUrl} imageError={imageError} />
        <PublicViewSidebar
          products={products}
          productsError={productsError}
          isProductsLoading={isProductsLoading}
        />
      </main>
    </div>
  );
}
