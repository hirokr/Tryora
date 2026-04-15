"use client";

import Image from "next/image";

export function UploadCard({
  title,
  hint,
  image,
  status,
  cta,
}: {
  title: string;
  hint: string;
  image: string;
  status: string;
  cta: string;
}) {
  return (
    <article className="rounded-xl border border-primary/20 bg-white/5 p-5 backdrop-blur-md">
      <div className="relative mb-5 aspect-[3/4] overflow-hidden rounded-lg border border-dashed border-primary/30">
        <Image src={image} alt={title} fill className="object-cover opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/45">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary/70">person</span>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-slate-300">Recommended Pose</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
      <p className="mt-3 inline-block rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
        {status}
      </p>

      <button className="mt-5 w-full rounded-lg border border-primary/40 bg-primary/15 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary">
        {cta}
      </button>
    </article>
  );
}

export function UpdatePicsFooter() {
  return (
    <section className="mt-10 flex flex-col items-center gap-5 border-t border-primary/10 pt-8">
      <div className="rounded-2xl border border-primary/20 bg-background-dark/60 px-5 py-3">
        <p className="text-xs text-slate-300">
          Gemini AI Engine v2.4 - Processing takes approximately 120 seconds
        </p>
      </div>

      <button className="rounded-full bg-primary px-10 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(140,43,238,0.4)] transition-all hover:bg-primary/90">
        Sync with AI Persona
      </button>

      <p className="text-xs text-slate-500">Encrypted, private, temporary storage for biometric processing.</p>
    </section>
  );
}
