import Link from "next/link";

const brands = ["VOGUE", "PRADA", "GUCCI", "NIKE", "Zara", "CHANEL", "ADIDAS"];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-background-dark/40 z-10 hero-gradient"></div>
            <div className="h-full w-full bg-slate-900 flex items-center justify-center">
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #3a1a5e 0%, #0a070d 70%)", opacity: 0.5 }}></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="absolute inset-0 h-full w-full object-cover opacity-60"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSw4BjkZYfEJz2DwEVEnVh--hR-9B0GcBNUgtFs90UkvSJkw_GkEohNkIR6uYXop50_tOVtjlNTaCZguCA5ZgQSCp8aHULNyVRYVZDkbduoSmL5oCFs1YtEjS2uHBXJ4s2Uzy4jXIGX0MLaEHhkxAyEIHZSaDN1GqXZp2GoXdQ12jWA3g2q5NiZ5kuCxeq0ylbyOvGnPeWmf-ZwTfBpILES1TmkGe4zste1q49q7QR1Srl60ggNfipJMNLIDzc7tsZU5bdjXxECERr"
                alt="Futuristic digital character with neon accents"
              />
            </div>
          </div>

          <div className="relative z-20 flex flex-col items-center gap-8 px-6 text-center">
            
            <h1 className="font-serif text-5xl font-bold leading-tight text-white md:text-7xl lg:max-w-4xl">
              Experience the <span className="text-primary">Future</span> of Fashion
            </h1>
            <p className="max-w-2xl text-lg text-slate-300 md:text-xl">
              AI-driven 3D reconstruction and cinematic try-on experiences.{" "}
              Your digital identity, perfectly draped.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup" className="flex h-14 min-w-[200px] items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-white transition-all hover:scale-105">
                Launch Studio
              </Link>
              <a href="#features" className="flex h-14 min-w-[200px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/10">
                View Showcase
              </a>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
            <span className="material-symbols-outlined text-white">keyboard_double_arrow_down</span>
          </div>
        </section>

        {/* Brand Partner Ticker */}
        <section className="py-12 bg-background-dark border-y border-primary/10 overflow-hidden">
          <div className="container mx-auto px-6 mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Trusted by Global Fashion Leaders</p>
          </div>
          <div className="relative flex overflow-x-hidden">
            <div className="animate-scroll flex items-center gap-16 md:gap-24 px-4">
              {/* Brand Set 1 */}
              <div className="flex items-center gap-16 md:gap-24">
                {brands.map((brand) => (
                  <span key={`a-${brand}`} className="text-2xl md:text-3xl font-serif font-bold text-slate-600 grayscale hover:grayscale-0 hover:text-primary transition-all cursor-default">{brand}</span>
                ))}
              </div>
              {/* Brand Set 2  duplicate for seamless loop */}
              <div className="flex items-center gap-16 md:gap-24">
                {brands.map((brand) => (
                  <span key={`b-${brand}`} className="text-2xl md:text-3xl font-serif font-bold text-slate-600 grayscale hover:grayscale-0 hover:text-primary transition-all cursor-default">{brand}</span>
                ))}
              </div>
            </div>
            {/* Gradient fade overlays */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background-dark to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background-dark to-transparent"></div>
          </div>
        </section>

        {/* AI-Driven 3D Try-On Section */}
        <section id="features" className="py-24 lg:py-32 px-6 lg:px-20 bg-background-dark">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="flex flex-col gap-8">
                <h2 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
                  AI-Driven <br /><span className="text-primary italic">3D Try-On</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed">
                  Immerse yourself in a high-fidelity virtual fitting room where garments drape perfectly on your digital twin with sub-millimeter accuracy.
                </p>
                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
                      <span className="material-symbols-outlined">straighten</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Precision Mapping</h4>
                      <p className="text-slate-400">Sub-millimeter accuracy for every unique body type.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
                      <span className="material-symbols-outlined">waves</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Real-time Physics</h4>
                      <p className="text-slate-400">Fabric simulation powered by advanced AI vertex prediction.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl transition-all group-hover:bg-primary/30"></div>
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-primary/20 bg-accent-dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="h-full w-full object-cover opacity-80"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmURjFEXGYG0cY40fiMGYz1rGBQ970CxlrCw7n2aNVKz2ipqaOiLC3gm7ux6hP9C2qM9AODYiZrCnhAAtapQkofCJSxcKrpR8ckEWRJwHbN3gpGCJG4ABagTR6zF970tmFc3ebFhURzNtLX5wJdTjvyUdVZ49mmvdYOFgKsNLedL-SUKhle5dUux4ZVWuzKIBk3M5ACsMjK2ovYtL2nGkObAaF2_FzRi8BCghyA_qPnky5akp1Ef63c688cQxNU4evRP81eDwlEvij"
                    alt="Digital mannequin being scanned by laser lights"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Distributed Wardrobe */}
        <section className="py-24 lg:py-32 px-6 lg:px-20 bg-accent-dark">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">Distributed Wardrobe</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">Access your digital collection across any platform, game, or metaverse instantly.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: "public", title: "Universal Access", desc: "Your clothes follow you everywhere. Seamless integration with major gaming engines." },
                { icon: "shield_lock", title: "Blockchain Secured", desc: "Ownership verified on the distributed ledger. True digital scarcity and proof of origin." },
                { icon: "sync", title: "Cloud Syncing", desc: "Instantly update your style across all connected accounts and virtual spaces." },
              ].map((card) => (
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

        {/* AI Scene Generation */}
        <section className="py-24 lg:py-32 px-6 lg:px-20 bg-background-dark overflow-hidden">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Image Grid */}
              <div className="relative order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-primary/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhhOGrJBwil0veL1qyyIuiDLLYgXX1HGKGOdq2EJjhcaUlycP9TAv49Ncbsl2Pwi_LmG85lmrNbJGyZeK4IO7GnuUrMV-0BQde8H1SFZTdW-JDhi9C5R0gbnOY0HULm2v6imX49RYc-nwS0p1O3DI72gj865DZEsVoLRXgDCYHT--rxIGNmSubDlywLO2grnWvD9ZNzeRGCBnC8AqIO5_RrsHYijooEXd_vBt7AN0JC5EzOx6OdrcE5BWUg8gjk_HRuJZAqBeKDnIt" alt="Cyberpunk city street environment" />
                    </div>
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-primary/20 translate-x-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEN32Yct3QsxfpYzLoXUTjKSRNn-n1dGFqCuqmdhrlkCryhY70k065d9tzHwkPRsbTpWrdHVJGF1V1C3wuhhMfShGHkd0EcfFJxeaoyAMmIC-1EJz8DKo_31EbwpV5IwwZaOHirtaANR6RSTNKKz7nDo3yfITzItUPZPFOLkLebLH8IglrNueJrTQgDlE8oh0XU0gJ58BoKzXM1bC21dKURUTj0-LjoVN7Fqo2bZTWy1I6JWSrVOquE40zpGJVNcE819xBkHYfrxYQ" alt="High mountain landscape environment" />
                    </div>
                  </div>
                  <div className="space-y-4 pt-12">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-primary/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZHoNh0dNRvpZMsjipmGTLDeICjLz0zn5xp9NO2u4WnnPFKsF0gc4eTGa-YnfxIFTx6ar38jVHFX1qbF4hXlL14jpR0xvPxdGj017IbWv9BZDTzm9XoWTNcM6NXYWvhZHo_PXIEgEUGgyV1d8mpW5MTIEjSjuNnFPIcCMy0VzAb2Oh-VO0NeuXWgcvayiG6PxAYqC9BD5d-eyRtEitk4QuYFakLc-nhLGn96Z8AJeRDK0kgAMt620lwt-XtjmZZDPfjYXU8JR6f5tj" alt="Dense forest lighting environment" />
                    </div>
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-primary/20 -translate-x-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUrTPkYMuoR4YhWx1o5ar8p8um6oyRMjazoasOHeolcMl3f-x_ee282REok1FuM1x5eRFdiQwU6F_wqZGSpUt128SUioK2rHtVecqNxaEO0IkcJP_qmb3551at70Q5rF3Jbn-NAdRbVoLfQVcIb3QbDmAhASOTqHO0DsuCCIBDtHZHJuffgQ0RDJ1NYx4WrVaY2z4wiAI-S5ExFQtAdqxgIItQotbYXV-Simc3D6f9uol3eYh-k9ifhO3OWNGTQksK5ccZRRGE1uWk" alt="Minimalist architectural environment" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-8 order-1 lg:order-2">
                <h2 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
                  AI Scene <br /><span className="text-primary italic">Generation</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed">
                  Transport your avatar to any environment with AI-generated cinematic backgrounds that react to your movements and clothing textures.
                </p>
                <div className="flex flex-col gap-6">
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary">landscape</span>
                    <div>
                      <h4 className="font-bold text-white">Infinite Environments</h4>
                      <p className="text-slate-400">From futuristic neo-Tokyo to serene natural landscapes.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary">light_mode</span>
                    <div>
                      <h4 className="font-bold text-white">Dynamic Lighting</h4>
                      <p className="text-slate-400">Ray-traced lighting that reacts to your 3D model in real-time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Brands Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-20 bg-background-dark border-t border-primary/10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-4xl font-bold text-white md:text-5xl mb-6">Elevate Your Brand with Tryora</h2>
              <p className="mx-auto max-w-3xl text-xl text-slate-400">
                Empower your customers with the future of digital retail. Reduce returns by up to 40% and increase engagement with hyper-realistic 3D experiences.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: "integration_instructions", title: "Seamless Integration", desc: "One-click SDK for existing e-commerce platforms like Shopify, Magento, and custom builds." },
                { icon: "monitoring", title: "Insightful Analytics", desc: "Track virtual engagement, try-on rates, and customer body data trends in real-time." },
                { icon: "language", title: "Global Scalability", desc: "Deploy your digital collection across web, mobile, and the metaverse with a single asset pipeline." },
              ].map((card) => (
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
              <Link href="/signup" className="flex h-14 items-center px-10 rounded-xl bg-primary text-lg font-bold text-white hover:scale-105 transition-transform shadow-[0_0_20px_rgba(140,43,238,0.3)]">
                Partner With Us
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 lg:py-40 bg-background-dark">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#8c2bee 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
          <div className="mx-auto max-w-4xl px-6 relative z-10 text-center">
            <h2 className="font-serif text-4xl font-bold text-white md:text-6xl mb-8">
              Ready to step into the <span className="text-primary">Future</span>?
            </h2>
            <p className="text-xl text-slate-300 mb-12 italic">Join thousands of creators defining the next generation of style.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/signup" className="flex h-16 items-center px-10 rounded-2xl bg-primary text-xl font-bold text-white hover:scale-105 transition-transform shadow-[0_0_40px_rgba(140,43,238,0.3)]">
                Create Your Avatar
              </Link>
            </div>
            
          </div>
        </section>

      </main>  
    </div>
  );
}
// This file is the main landing page for the Tryora website. It includes multiple sections showcasing the features and benefits of the Tryora platform, such as AI-driven 3D try-on, distributed wardrobe, and AI scene generation. The page is designed with a futuristic aesthetic, using a dark color scheme with neon accents and high-quality images to create an immersive experience for visitors.
