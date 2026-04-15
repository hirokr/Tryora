"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  UpdatePicsFooter,
  UploadCard,
} from "@/components/utility/experience/UpdatePicsWorkspace";

import { UPDATE_PICS_REFERENCE_IMAGES } from "@/constants/experience";

import { UpdatePicsIntro } from "./_components/UpdatePicsIntro";

type ViewType = "front" | "side" | "back";

type UploadedPhoto = {
  url: string;
  status: string;
};

const AVATAR_UPLOADS_STORAGE_KEY = "tryora.avatar.uploadedPhotos";
const MODEL_3D_STATE_STORAGE_KEY = "tryora.avatar.model3d.state";

type Model3DState = {
  tryonResultId: string;
  jobId?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress?: number;
  currentStage?: string;
  glbUrl?: string;
  errorMessage?: string;
  updatedAt: string;
};

export default function UpdatePicsPage() {
  const router = useRouter();
  const [uploadError, setUploadError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<ViewType, UploadedPhoto>>({
    front: {
      url: UPDATE_PICS_REFERENCE_IMAGES.front,
      status: "Not uploaded yet",
    },
    side: {
      url: UPDATE_PICS_REFERENCE_IMAGES.side,
      status: "Not uploaded yet",
    },
    back: {
      url: UPDATE_PICS_REFERENCE_IMAGES.back,
      status: "Not uploaded yet",
    },
  });

  const allUploaded = useMemo(
    () => (Object.keys(uploadedPhotos) as ViewType[]).every((view) =>
      uploadedPhotos[view].status.toLowerCase().includes("uploaded"),
    ),
    [uploadedPhotos],
  );

  const handleUploadComplete = (view: ViewType, url: string) => {
    setUploadError("");

    const nextState: Record<ViewType, UploadedPhoto> = {
      ...uploadedPhotos,
      [view]: {
        url,
        status: "Uploaded just now",
      },
    };

    setUploadedPhotos(nextState);
    localStorage.setItem(AVATAR_UPLOADS_STORAGE_KEY, JSON.stringify(nextState));
  };

  const resolveTryonResultId = () => {
    const possibleValues = [
      new URLSearchParams(window.location.search).get("tryonResultId"),
      localStorage.getItem("tryora.tryonResultId"),
      localStorage.getItem("tryora.tryon.resultId"),
      localStorage.getItem("tryora.avatar.tryonResultId"),
    ];

    return possibleValues.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
  };

  const handleSync = async () => {
    if (isSyncing) return;

    setUploadError("");

    const tryonResultId = resolveTryonResultId();
    if (!tryonResultId) {
      setUploadError("Could not find tryonResultId. Open this page from a completed try-on result and try again.");
      return;
    }

    setIsSyncing(true);
    localStorage.setItem(AVATAR_UPLOADS_STORAGE_KEY, JSON.stringify(uploadedPhotos));

    try {
      const response = await fetch("/api/3d/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tryonResultId,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        jobId?: string;
        status?: "QUEUED" | "PROCESSING";
        glbUrl?: string;
      };

      if (response.status === 202 && payload.jobId) {
        const next3DState: Model3DState = {
          tryonResultId,
          jobId: payload.jobId,
          status: payload.status || "QUEUED",
          progress: 0,
          currentStage: "queued",
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(MODEL_3D_STATE_STORAGE_KEY, JSON.stringify(next3DState));
        router.push("/ai_result");
        return;
      }

      if (response.status === 409 && payload.glbUrl) {
        const next3DState: Model3DState = {
          tryonResultId,
          status: "COMPLETED",
          glbUrl: payload.glbUrl,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(MODEL_3D_STATE_STORAGE_KEY, JSON.stringify(next3DState));
        router.push("/ai_result");
        return;
      }

      setUploadError(payload.message || "Failed to start 3D generation. Please try again.");
    } catch {
      setUploadError("Failed to connect to 3D generation service. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <UpdatePicsIntro />

      {uploadError && (
        <p className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {uploadError}
        </p>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <UploadCard
          title="Front View"
          hint="Direct gaze, neutral lighting"
          image={uploadedPhotos.front.url}
          status={uploadedPhotos.front.status}
          cta="Upload Photo"
          onUploadComplete={(url) => handleUploadComplete("front", url)}
          onUploadError={setUploadError}
        />
        <UploadCard
          title="Side View"
          hint="90-degree angle, clear jawline"
          image={uploadedPhotos.side.url}
          status={uploadedPhotos.side.status}
          cta="Upload Photo"
          onUploadComplete={(url) => handleUploadComplete("side", url)}
          onUploadError={setUploadError}
        />
        <UploadCard
          title="Back View"
          hint="Clear hair texture and silhouette"
          image={uploadedPhotos.back.url}
          status={uploadedPhotos.back.status}
          cta="Upload Photo"
          onUploadComplete={(url) => handleUploadComplete("back", url)}
          onUploadError={setUploadError}
        />
      </section>

      <UpdatePicsFooter
        onSync={handleSync}
        syncDisabled={!allUploaded || isSyncing}
        syncLabel={isSyncing ? "Starting 3D generation..." : "Sync with AI Persona"}
      />
    </main>
  );
}
