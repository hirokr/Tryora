import { ProductCard } from "./ProductCard";
import type { Product } from "../../../../types/producttypes";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 bg-white/50 dark:bg-primary/5 p-8 text-center text-slate-500 dark:text-slate-400">
        No products found for this filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
