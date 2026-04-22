import Link from "next/link";

import type { DashboardMetrics as DashboardMetricsData } from "../../../../types/dashboardtypes";

type DashboardMetricsProps = {
  metrics: DashboardMetricsData;
};

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-white/10 bg-[#171226] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Favourites</p>
        <p className="mt-3 text-4xl font-semibold">{metrics.favouriteCount}</p>
      </article>

      <article className="rounded-2xl border border-white/10 bg-[#171226] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Try-on Images</p>
        <p className="mt-3 text-4xl font-semibold">{metrics.tryonImagesCount}</p>
      </article>

      <Link
        href="/wardrobe"
        className="rounded-2xl border border-emerald-300/25 bg-[#171226] p-5 text-white transition-colors hover:bg-[#1d1630]"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Wardrobe Items</p>
        <p className="mt-3 text-4xl font-semibold">{metrics.wardrobeItemsCount}</p>
        <p className="mt-2 text-sm text-slate-300">Open wardrobe</p>
      </Link>
    </section>
  );
}
