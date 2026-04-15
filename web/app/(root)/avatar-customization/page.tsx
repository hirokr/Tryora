"use client";

import { useState } from "react";

import { AvatarCustomizationSidebar } from "@/components/utility/avatar/customization/AvatarCustomizationSidebar";
import { AvatarCustomizationViewport } from "@/components/utility/avatar/customization/AvatarCustomizationViewport";

export default function AvatarCustomizationPage() {
  const [activeSkin, setActiveSkin] = useState(0);
  const [activeHair, setActiveHair] = useState(1);
  const [activeMotion, setActiveMotion] = useState(0);

  return (
    <div
      className="flex min-h-screen flex-col overflow-hidden pt-20 text-slate-100"
      style={{ backgroundColor: "#191022" }}
    >
      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <AvatarCustomizationViewport
          activeMotion={activeMotion}
          setActiveMotion={setActiveMotion}
        />
        <AvatarCustomizationSidebar
          activeSkin={activeSkin}
          setActiveSkin={setActiveSkin}
          activeHair={activeHair}
          setActiveHair={setActiveHair}
        />
      </main>
    </div>
  );
}
