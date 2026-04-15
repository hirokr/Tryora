import type { Product } from "../../../../types/producttypes";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group bg-white dark:bg-primary/5 rounded-[0.75rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-transparent hover:border-primary/30 transition-all hover:-translate-y-1 cursor-pointer">
      <div className="relative aspect-square overflow-hidden">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={product.alt}
          src={product.img}
        />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="size-8 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">favorite</span>
          </button>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-1 truncate">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <p className="text-primary font-bold text-xl">{product.price}</p>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {product.category}
          </span>
        </div>
      </div>
    </div>
  );
}
