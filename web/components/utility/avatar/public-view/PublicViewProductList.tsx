//6

import type { SidebarProduct } from "@/types/publicView";

type PublicViewProductListProps = {
  products: SidebarProduct[];
};

export function PublicViewProductList({ products }: PublicViewProductListProps) {
  return (
    <div className="space-y-3">
      {products.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3"
        >
          <div
            className="size-14 rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url('${item.img}')` }}
          />
          <div className="flex-1">
            <p className="font-bold text-white">{item.name}</p>
            <p className="text-sm text-primary">{item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
