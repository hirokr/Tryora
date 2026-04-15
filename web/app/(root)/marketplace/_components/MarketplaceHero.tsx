import type { FilterType } from "../../../../types/producttypes";

type MarketplaceHeroProps = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
};

const FILTERS: FilterType[] = ["All", "Clothing", "Accessories"];

export function MarketplaceHero({ activeFilter, onFilterChange }: MarketplaceHeroProps) {
  return (
    <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h2 className="heading-georgia text-4xl md:text-5xl text-slate-900 dark:text-white font-normal mb-2 tracking-tight">
          Discover Your Style
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg">
          Curated collection of traditional and modern Bangladeshi fashion, handcrafted by the
          finest artisans.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-500">Filter by:</span>
        <div className="flex bg-slate-200 dark:bg-primary/20 p-1 rounded-lg">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeFilter === filter
                  ? "bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-primary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
