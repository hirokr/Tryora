type FeatureCard = {
  icon: string;
  title: string;
  desc: string;
};

type DistributedWardrobeSectionProps = {
  cards: FeatureCard[];
};

export function DistributedWardrobeSection({ cards }: DistributedWardrobeSectionProps) {
  return (
    <section className="bg-accent-dark px-6 py-24 lg:px-20 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">Distributed Wardrobe</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">Access your digital collection across any platform, game, or metaverse instantly.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="glass-card flex flex-col gap-6 rounded-2xl p-8 transition-transform hover:-translate-y-2">
              <div className="text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: "2.25rem" }}>{card.icon}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">{card.title}</h3>
              <p className="text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
