"use client";

import { SettingsPanel } from "@/components/utility/experience/SettingsWorkspace";

import { useSettingsPreferences } from "@/hooks";

export default function SettingsPage() {
  const { envMode, setEnvMode, quality, setQuality } = useSettingsPreferences();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsPanel
          envMode={envMode}
          setEnvMode={setEnvMode}
          quality={quality}
          setQuality={setQuality}
        />
      </div>
    </main>
  );
}
