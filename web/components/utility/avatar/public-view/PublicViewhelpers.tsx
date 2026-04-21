import {
  MODEL_3D_STATE_STORAGE_KEY,
  TRYON_RESULT_STORAGE_KEY,
  TRYON_RESULT_STORAGE_KEY_ALT,
  TRYON_RESULT_STORAGE_KEY_AVATAR,
} from "@/constants/flow";
import type { ProductResponse } from "@/types/publicView";

export function resolveJobId() {
  const queryJobId = new URLSearchParams(window.location.search).get("jobId");
  if (queryJobId?.trim()) {
    return queryJobId.trim();
  }

  const possibleStorageValues = [
    localStorage.getItem("tryora.tryonJobId"),
    localStorage.getItem("tryora.avatar.tryonJobId"),
  ];

  const fromStorage = possibleStorageValues.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (fromStorage) {
    return fromStorage.trim();
  }

  const model3dStateRaw = localStorage.getItem(MODEL_3D_STATE_STORAGE_KEY);
  if (!model3dStateRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(model3dStateRaw) as { jobId?: string };
    if (parsed?.jobId?.trim()) {
      return parsed.jobId.trim();
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveTryonId() {
  const queryTryonId = new URLSearchParams(window.location.search).get("tryonId");
  if (queryTryonId?.trim()) {
    return queryTryonId.trim();
  }

  const possibleStorageValues = [
    localStorage.getItem(TRYON_RESULT_STORAGE_KEY),
    localStorage.getItem(TRYON_RESULT_STORAGE_KEY_ALT),
    localStorage.getItem(TRYON_RESULT_STORAGE_KEY_AVATAR),
  ];

  const fromStorage = possibleStorageValues.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (fromStorage) {
    return fromStorage.trim();
  }

  const model3dStateRaw = localStorage.getItem(MODEL_3D_STATE_STORAGE_KEY);
  if (!model3dStateRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(model3dStateRaw) as { tryonResultId?: string };
    if (parsed?.tryonResultId?.trim()) {
      return parsed.tryonResultId.trim();
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeProduct(payload: unknown): ProductResponse | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.id === "string") {
    return record as ProductResponse;
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (typeof nested.id === "string") {
      return nested as ProductResponse;
    }
  }

  if (record.result && typeof record.result === "object") {
    const nested = record.result as Record<string, unknown>;
    if (typeof nested.id === "string") {
      return nested as ProductResponse;
    }
  }

  return null;
}