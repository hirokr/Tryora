"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OUTFIT_COMPARISON_SELECTION_STORAGE_KEY } from "@/constants/flow";

import { ComparisonActions } from "./_components/ComparisonActions";
import { ComparisonImagePanel } from "./_components/ComparisonImagePanel";
import type { OutfitSelectionPayload } from "./_components/types";

async function loadBitmap(url: string): Promise<ImageBitmap> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to load image (${response.status})`);
  }

  const blob = await response.blob();
  return createImageBitmap(blob);
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
}

export default function OutfitComparisonPage() {
  const router = useRouter();

  const [selection, setSelection] = useState<OutfitSelectionPayload | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(OUTFIT_COMPARISON_SELECTION_STORAGE_KEY);
    if (!raw) {
      setSelection(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as OutfitSelectionPayload;
      if (parsed?.outfitA?.imageUrl && parsed?.outfitB?.imageUrl) {
        setSelection(parsed);
        return;
      }
    } catch {
      // Ignore malformed stale payloads and clear them.
    }

    localStorage.removeItem(OUTFIT_COMPARISON_SELECTION_STORAGE_KEY);
    setSelection(null);
  }, []);

  const selectedAtLabel = useMemo(() => {
    if (!selection?.selectedAt) return null;
    return new Date(selection.selectedAt).toLocaleString();
  }, [selection?.selectedAt]);

  const handleUploadPhoto = () => {
    router.push("/dashboard?section=me-and-myself&source=outfit-comparison");
  };

  const handleSnapshot = async () => {
    if (!selection?.outfitA?.imageUrl || !selection?.outfitB?.imageUrl) return;
    setSnapshotError(null);

    try {
      const [left, right] = await Promise.all([
        loadBitmap(selection.outfitA.imageUrl),
        loadBitmap(selection.outfitB.imageUrl),
      ]);

      const targetHeight = 1200;
      const gap = 24;

      const leftWidth = Math.round((left.width / left.height) * targetHeight);
      const rightWidth = Math.round((right.width / right.height) * targetHeight);

      const canvas = document.createElement("canvas");
      canvas.width = leftWidth + rightWidth + gap;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas is unavailable.");
      }

      context.fillStyle = "#0e0a18";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(left, 0, 0, leftWidth, targetHeight);
      context.drawImage(right, leftWidth + gap, 0, rightWidth, targetHeight);

      downloadCanvas(canvas, "outfit-comparison-snapshot.png");
    } catch {
      setSnapshotError("Failed to generate snapshot. Please try with different images.");
    }
  };

  return (
    <div
      className="flex min-h-screen w-full overflow-hidden pt-20 font-display text-slate-100"
      style={{ backgroundColor: "#191022" }}
    >
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <h1 className="text-lg font-bold text-white">Outfit Comparison</h1>
            <p className="mt-1 text-xs text-slate-400">
              {selectedAtLabel
                ? `Selected from Me & Myself on ${selectedAtLabel}`
                : "Choose exactly two photos from Dashboard -> Me & Myself."}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <ComparisonImagePanel
            title="Outfit A"
            imageUrl={selection?.outfitA?.imageUrl || null}
            emptyHint="Outfit A is empty. Click Upload Photo and select your first image from Me & Myself."
          />

          <ComparisonImagePanel
            title="Outfit B"
            imageUrl={selection?.outfitB?.imageUrl || null}
            emptyHint="Outfit B is empty. Click Upload Photo and select your second image from Me & Myself."
            mirrored
          />
        </div>

        <ComparisonActions
          canSnapshot={Boolean(selection?.outfitA?.imageUrl && selection?.outfitB?.imageUrl)}
          onUploadPhoto={handleUploadPhoto}
          onSnapshot={handleSnapshot}
        />

        {snapshotError ? <p className="px-6 pb-4 text-sm text-red-300">{snapshotError}</p> : null}
      </main>
    </div>
  );
}
