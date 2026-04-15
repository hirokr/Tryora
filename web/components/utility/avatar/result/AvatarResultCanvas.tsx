"use client";

import { useEffect, useState } from "react";

type UploadedPhotoState = {
  front?: {
    url: string;
    status: string;
  };
};

const AVATAR_UPLOADS_STORAGE_KEY = "tryora.avatar.uploadedPhotos";

export function AvatarResultCanvas() {
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState("/avatar/avatar_result1.png");

  useEffect(() => {
    const rawValue = localStorage.getItem(AVATAR_UPLOADS_STORAGE_KEY);
    if (!rawValue) return;

    try {
      const parsed = JSON.parse(rawValue) as UploadedPhotoState;
      const frontUrl = parsed?.front?.url;
      if (frontUrl) {
        setAvatarPreviewSrc(frontUrl);
      }
    } catch {
      // Ignore malformed local storage payload.
    }
  }, []);

  return (
    <div className="lg:col-span-7 xl:col-span-8">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-primary/10 lg:h-[600px]"
        style={{ backgroundColor: "#0f0a1a" }}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f0a1a]/80 via-transparent to-transparent opacity-60" />

        <img
          alt="3D Avatar Preview"
          className="h-full w-full object-cover"
          src={avatarPreviewSrc}
        />

        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20">
              <span className="material-symbols-outlined">360</span>
            </button>
            <button className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
            <span className="size-2 animate-pulse rounded-full bg-green-500" />
            Live Render
          </div>
        </div>
      </div>
    </div>
  );
}
