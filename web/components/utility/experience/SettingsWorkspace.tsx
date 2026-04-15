"use client";

import Image from "next/image";

import type { EnvMode, QualityMode } from "@/types/experience";

type SettingsPanelProps = {
  envMode: EnvMode;
  setEnvMode: (mode: EnvMode) => void;
  quality: QualityMode;
  setQuality: (quality: QualityMode) => void;
};

export function SettingsPanel({ envMode, setEnvMode, quality, setQuality }: SettingsPanelProps) {
  return (
    <section className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-8">
      <div className="space-y-10">
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">3D Environment</h2>
              <p className="text-sm text-slate-400">Choose your workspace ambiance</p>
            </div>
            <div className="flex rounded-lg bg-primary/10 p-1">
              {(["dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEnvMode(mode)}
                  className={`rounded-md px-4 py-2 text-sm font-bold capitalize transition-colors ${
                    envMode === mode ? "bg-primary text-white" : "text-slate-400 hover:text-primary"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl border border-primary/20">
            <Image src="/settings.png" alt="Environment preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <p className="absolute bottom-4 left-4 rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              Current Preview: {envMode === "dark" ? "Neon Night" : "Morning Light"}
            </p>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Avatar Quality</h3>
            <div className="space-y-3">
              {(["ultra", "balanced"] as const).map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                    quality === option
                      ? "border-primary/40 bg-primary/10"
                      : "border-primary/10 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quality"
                      checked={quality === option}
                      onChange={() => setQuality(option)}
                      className="accent-primary"
                    />
                    <span className="font-medium text-slate-100">
                      {option === "ultra" ? "Ultra High" : "Balanced"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {option === "ultra" ? "4K Textures" : "Standard"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Camera Sensitivity</h3>
            <div className="space-y-6 pt-2">
              {[
                { label: "Pan Speed", value: 75 },
                { label: "Zoom Speed", value: 40 },
              ].map((slider) => (
                <div key={slider.label}>
                  <div className="mb-2 flex justify-between text-xs font-bold text-primary">
                    <span>{slider.label}</span>
                    <span>{slider.value}%</span>
                  </div>
                  <input
                    type="range"
                    defaultValue={slider.value}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-primary/20 accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-primary/10 pt-6">
          <h3 className="mb-6 text-lg font-bold text-white">General Preferences</h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="workspace_name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workspace Name
              </label>
              <input
                id="workspace_name"
                type="text"
                defaultValue="Alex's Studio"
                className="w-full rounded-lg border border-primary/20 bg-background-dark px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="region" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Deployment Region
              </label>
              <select
                id="region"
                className="w-full rounded-lg border border-primary/20 bg-background-dark px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option>North America (East)</option>
                <option>Europe (West)</option>
                <option>Asia Pacific</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button className="rounded-xl px-5 py-2.5 font-bold text-slate-400 transition-colors hover:text-primary">
            Discard Changes
          </button>
          <button className="rounded-xl bg-primary px-7 py-2.5 font-bold text-white transition-all hover:bg-primary/90">
            Save Preferences
          </button>
        </div>
      </div>
    </section>
  );
}
