import type { FilterType } from "../../../../types/producttypes";

type MarketplaceHeroProps = {
  activeFilters: FilterType[];
  onFilterToggle: (filter: FilterType) => void;
};

const FILTERS: FilterType[] = ["All", "Cloth", "Accessaries", "Shoes"];

export function MarketplaceHero({ activeFilters, onFilterToggle }: MarketplaceHeroProps) {
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
        <span className="text-sm font-medium text-slate-500">Category:</span>
        <div className="flex bg-slate-200 dark:bg-primary/20 p-1 rounded-lg">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterToggle(filter)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                activeFilters.includes(filter)
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white/70 dark:bg-primary/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-primary/20"
              }`}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {filter}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
