import type { CSSProperties } from "react";

import { PublicViewProductList } from "./PublicViewProductList";
import type { SidebarProduct } from "@/types/publicView";

type PublicViewSidebarProps = {
  products: SidebarProduct[];
  productsError: string | null;
  isProductsLoading: boolean;
};

export function PublicViewSidebar({
  products,
  productsError,
  isProductsLoading,
}: PublicViewSidebarProps) {
  const glass: CSSProperties = {
    background: "rgba(25,16,34,0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(140,43,238,0.2)",
  };

  return (
    <aside className="w-full border-primary/20 p-8 lg:w-[420px] lg:border-l" style={glass}>
      <h1 className="mb-3 font-serif text-4xl italic">Cyber-Glow Ensemble</h1>
      <p className="mb-6 text-primary/60">A high-fidelity 3D look generated for the metaverse.</p>

      {productsError ? <p className="mb-4 text-sm text-red-300">{productsError}</p> : null}
      {isProductsLoading ? <p className="mb-4 text-sm text-slate-300">Loading products...</p> : null}
      {!isProductsLoading && !productsError && products.length === 0 ? (
        <p className="mb-4 text-sm text-slate-300">No products to display.</p>
      ) : null}

      <PublicViewProductList products={products} />
    </aside>
  );
}
