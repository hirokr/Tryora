import { AVATAR_BODY_SLIDERS, HAIR_STYLES, SKIN_TONES } from "@/constants/data";

interface AvatarCustomizationSidebarProps {
  activeSkin: number;
  setActiveSkin: (index: number) => void;
  activeHair: number;
  setActiveHair: (index: number) => void;
}

export function AvatarCustomizationSidebar({
  activeSkin,
  setActiveSkin,
  activeHair,
  setActiveHair,
}: AvatarCustomizationSidebarProps) {
  return (
    <aside
      className="h-full w-full border-l border-white/5 p-6 md:w-[420px]"
      style={{
        background: "rgba(43,28,58,0.4)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-serif text-white">Customization</h1>
        <p className="text-sm text-slate-400">Fine-tune your digital twin with precision.</p>
      </div>

      <section className="mb-6">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
            straighten
          </span>
          <h3 className="text-sm font-bold uppercase tracking-widest">Body Measurements</h3>
        </div>

        <div className="space-y-6 rounded-xl border border-white/5 bg-white/5 p-5">
          {AVATAR_BODY_SLIDERS.map((slider) => (
            <div key={slider.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-200">{slider.label}</label>
                <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs text-primary">
                  {slider.value}
                </span>
              </div>
              <input
                type="range"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-primary"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
            face
          </span>
          <h3 className="text-sm font-bold uppercase tracking-widest">Appearance</h3>
        </div>

        <div className="space-y-6 rounded-xl border border-white/5 bg-white/5 p-5">
          <div className="space-y-3">
            <label className="text-sm text-slate-200">Skin Tone</label>
            <div className="flex gap-3">
              {SKIN_TONES.map((tone, i) => (
                <button
                  key={tone}
                  onClick={() => setActiveSkin(i)}
                  className={`size-8 rounded-full border-2 transition-all ${
                    activeSkin === i
                      ? "border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-[#191022]"
                      : "border-transparent hover:border-white/50"
                  }`}
                  style={{ backgroundColor: tone }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-slate-200">Hair Style</label>
            <div className="grid grid-cols-3 gap-2">
              {HAIR_STYLES.map((hair, i) => (
                <div
                  key={hair.label}
                  onClick={() => setActiveHair(i)}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                    activeHair === i
                      ? "border-primary/40 bg-primary/20"
                      : "border-white/5 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-slate-800">
                    <div
                      className="h-full w-full bg-cover bg-center transition-transform duration-300"
                      style={{
                        backgroundImage: `url('${hair.img}')`,
                        opacity: activeHair === i ? 1 : 0.6,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      activeHair === i ? "text-primary" : "text-slate-400"
                    }`}
                  >
                    {hair.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: "1.125rem" }}>
          info
        </span>
        <p className="text-[11px] leading-relaxed text-slate-400">
          <strong className="text-slate-200">Manual Fallback Enabled:</strong> AI extraction
          resulted in a confidence score of 98.4%. You can manually override any parameter using
          the precision sliders above.
        </p>
      </div>
    </aside>
  );
} // This component, `AvatarCustomizationSidebar`, is responsible for rendering the sidebar of the avatar customization page. It provides users with controls to fine-tune their digital avatar's body measurements and appearance. The sidebar includes sections for adjusting body sliders (such as height, weight, etc.) and selecting skin tones and hair styles. Each section is visually distinct with icons and headings, and the controls are designed to be intuitive and responsive. The component also includes a manual fallback notice at the bottom, informing users about the confidence score of the AI extraction and allowing them to make manual adjustments if needed. The overall design is consistent with the futuristic and immersive aesthetic of the Tryora platform.
