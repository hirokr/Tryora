type BrandTickerSectionProps = {
  brands: string[];
};

export function BrandTickerSection({ brands }: BrandTickerSectionProps) {
  return (
    <section className="overflow-hidden border-y border-primary/10 bg-background-dark py-12">
      <div className="container mx-auto mb-8 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Trusted by Global Fashion Leaders</p>
      </div>
      <div className="relative flex overflow-x-hidden">
        <div className="animate-scroll flex items-center gap-16 px-4 md:gap-24">
          <div className="flex flex-shrink-0 items-center gap-16 md:gap-24">
            {brands.map((brand) => (
              <span key={`a-${brand}`} className="cursor-default whitespace-nowrap text-2xl font-bold text-slate-600 grayscale transition-all hover:text-primary hover:grayscale-0 md:text-3xl">
                {brand}
              </span>
            ))}
          </div>
          <div className="flex flex-shrink-0 items-center gap-16 md:gap-24">
            {brands.map((brand) => (
              <span key={`b-${brand}`} className="cursor-default whitespace-nowrap text-2xl font-bold text-slate-600 grayscale transition-all hover:text-primary hover:grayscale-0 md:text-3xl">
                {brand}
              </span>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background-dark to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background-dark to-transparent"></div>
      </div>
    </section>
  );
}
