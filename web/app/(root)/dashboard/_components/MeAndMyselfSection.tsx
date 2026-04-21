import type { MeAndMyselfImage } from "../../../../types/dashboardtypes";

type MeAndMyselfSectionProps = {
  images: MeAndMyselfImage[];
  isLoading: boolean;
  error: string | null;
};

export function MeAndMyselfSection({ images, isLoading, error }: MeAndMyselfSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#120e21] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Me &amp; Myself</p>
          <h2 className="mt-2 text-2xl font-semibold">Generated try-on images</h2>
        </div>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-300">Loading generated images...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {!isLoading && !error && images.length === 0 ? (
        <p className="mt-4 text-sm text-slate-300">No generated images found yet.</p>
      ) : null}

      {!isLoading && !error && images.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img src={item.imageUrl} alt={item.label} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="p-2">
                <p className="line-clamp-1 text-xs font-semibold text-white">{item.label}</p>
                {item.createdAt ? (
                  <p className="text-[11px] text-slate-300">{new Date(item.createdAt).toLocaleDateString()}</p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}
