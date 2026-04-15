"use client";

import {
  UpdatePicsFooter,
  UploadCard,
} from "@/components/utility/experience/UpdatePicsWorkspace";

import { UPDATE_PICS_REFERENCE_IMAGES } from "@/constants/experience";

import { UpdatePicsIntro } from "./_components/UpdatePicsIntro";

export default function UpdatePicsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <UpdatePicsIntro />

      <section className="grid gap-6 md:grid-cols-3">
        <UploadCard
          title="Front View"
          hint="Direct gaze, neutral lighting"
          image={UPDATE_PICS_REFERENCE_IMAGES.front}
          status="Captured 2h ago"
          cta="Upload Photo"
        />
        <UploadCard
          title="Side View"
          hint="90-degree angle, clear jawline"
          image={UPDATE_PICS_REFERENCE_IMAGES.side}
          status="Not uploaded yet"
          cta="Capture New"
        />
        <UploadCard
          title="Back View"
          hint="Clear hair texture and silhouette"
          image={UPDATE_PICS_REFERENCE_IMAGES.back}
          status="Not uploaded yet"
          cta="Upload Photo"
        />
      </section>

      <UpdatePicsFooter />
    </main>
  );
}
