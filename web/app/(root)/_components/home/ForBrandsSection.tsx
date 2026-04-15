import Link from "next/link";

type BrandCard = {
  icon: string;
  title: string;
  desc: string;
};

type ForBrandsSectionProps = {
  cards: BrandCard[];
};

export function ForBrandsSection({ cards }: ForBrandsSectionProps) {
  return (
    <section className="border-t border-primary/10 bg-background-dark px-6 py-24 lg:px-20 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 font-serif text-4xl font-bold text-white md:text-5xl">Elevate Your Brand with Tryora</h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-400">
            Empower your customers with the future of digital retail. Reduce returns by up to 40% and increase engagement with hyper-realistic 3D experiences.
          </p>
        </div>
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="glass-card flex flex-col gap-6 rounded-xl p-8 transition-all hover:shadow-[0_0_30px_rgba(140,43,238,0.2)]">
              <div className="text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: "2.25rem" }}>{card.icon}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">{card.title}</h3>
              <p className="text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Link href="/auth/signup" className="flex h-14 items-center rounded-xl bg-primary px-10 text-lg font-bold text-white shadow-[0_0_20px_rgba(140,43,238,0.3)] transition-transform hover:scale-105">
            Partner With Us
          </Link>
        </div>
      </div>
    </section>
  );
}
