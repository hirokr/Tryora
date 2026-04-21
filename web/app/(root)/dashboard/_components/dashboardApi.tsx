import { authFetch } from "@/lib/auth/clientAuthFetch";

import type {
  DashboardData,
  DashboardMetrics,
  MeAndMyselfImage,
  TryonRecord,
  UserProfile,
} from "../../../../types/dashboardtypes";

function normalizeProfile(payload: unknown): UserProfile | null {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  const base = (source.data && typeof source.data === "object"
    ? source.data
    : source) as Record<string, unknown>;

  if (typeof base.id !== "string") return null;

  return {
    id: base.id,
    name: typeof base.name === "string" ? base.name : undefined,
    email: typeof base.email === "string" ? base.email : undefined,
    avatarUrl: typeof base.avatarUrl === "string" ? base.avatarUrl : undefined,
    demographics:
      base.demographics && typeof base.demographics === "object"
        ? (base.demographics as UserProfile["demographics"])
        : undefined,
  };
}

function normalizeTryonCollection(payload: unknown): TryonRecord[] {
  if (Array.isArray(payload)) return payload as TryonRecord[];

  const source = (payload || {}) as Record<string, unknown>;
  if (Array.isArray(source.data)) return source.data as TryonRecord[];
  if (Array.isArray(source.results)) return source.results as TryonRecord[];

  return [];
}

async function fetchJobMeta(jobId: string): Promise<{ imageUrl: string | null; productIds: string[] }> {
  const response = await authFetch(`/api/tryon/jobs/${jobId}`, {
    method: "GET",
  });

  if (!response.ok) {
    return { imageUrl: null, productIds: [] };
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const data = (payload.data || {}) as Record<string, unknown>;
  const tryonData = (data.tryonData || {}) as Record<string, unknown>;

  const imageUrl =
    (typeof tryonData.resultUrl === "string" && tryonData.resultUrl) ||
    (typeof data.outputresultUrl === "string" && data.outputresultUrl) ||
    (typeof data.outputResultUrl === "string" && data.outputResultUrl) ||
    null;

  const productIds = Array.isArray(tryonData.productIds)
    ? (tryonData.productIds.filter((id) => typeof id === "string") as string[])
    : [];

  return { imageUrl, productIds };
}

function buildMetrics(records: Array<TryonRecord & { resolvedProductIds: string[] }>): DashboardMetrics {
  const wardrobeSet = new Set<string>();

  records.forEach((record) => {
    record.resolvedProductIds.forEach((id) => wardrobeSet.add(id));
  });

  return {
    favouriteCount: records.filter((record) => Boolean(record.isFavorite)).length,
    tryonImagesCount: records.length,
    wardrobeItemsCount: wardrobeSet.size,
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const profileResponse = await authFetch("/api/user/me", { method: "GET" });
  const profilePayload = await profileResponse.json().catch(() => ({}));
  const profile = profileResponse.ok ? normalizeProfile(profilePayload) : null;

  if (!profile?.id) {
    return {
      profile,
      metrics: {
        favouriteCount: 0,
        tryonImagesCount: 0,
        wardrobeItemsCount: 0,
      },
      gallery: [],
      publicTryonsCount: 0,
    };
  }

  const tryonResponse = await authFetch(`/api/tryon/user/${profile.id}`, {
    method: "GET",
  });

  if (!tryonResponse.ok) {
    return {
      profile,
      metrics: {
        favouriteCount: 0,
        tryonImagesCount: 0,
        wardrobeItemsCount: 0,
      },
      gallery: [],
      publicTryonsCount: 0,
    };
  }

  const tryonPayload = await tryonResponse.json().catch(() => ({}));
  const tryonRecords = normalizeTryonCollection(tryonPayload);

  const enriched = await Promise.all(
    tryonRecords.slice(0, 60).map(async (record, index) => {
      const nativeProductIds = Array.isArray(record.productIds)
        ? (record.productIds.filter((id) => typeof id === "string") as string[])
        : [];

      if (record.resultUrl && nativeProductIds.length > 0) {
        return {
          ...record,
          resolvedImageUrl: record.resultUrl,
          resolvedProductIds: nativeProductIds,
          label: record.tryonType || `Try-on #${index + 1}`,
        };
      }

      if (!record.jobId) {
        return {
          ...record,
          resolvedImageUrl: record.resultUrl || null,
          resolvedProductIds: nativeProductIds,
          label: record.tryonType || `Try-on #${index + 1}`,
        };
      }

      const jobMeta = await fetchJobMeta(record.jobId);

      return {
        ...record,
        resolvedImageUrl: record.resultUrl || jobMeta.imageUrl,
        resolvedProductIds: nativeProductIds.length > 0 ? nativeProductIds : jobMeta.productIds,
        label: record.tryonType || `Try-on #${index + 1}`,
      };
    }),
  );

  const gallery: MeAndMyselfImage[] = enriched
    .filter((record) => Boolean(record.resolvedImageUrl))
    .map((record) => ({
      id: record.id,
      imageUrl: record.resolvedImageUrl as string,
      createdAt: record.createdAt,
      label: record.label,
    }));

  const metrics = buildMetrics(enriched);
  const publicTryonsCount = enriched.filter((record) => Boolean(record.isPublic)).length;

  return {
    profile,
    metrics,
    gallery,
    publicTryonsCount,
  };
}

export async function updateProfile(payload: {
  name: string;
  email: string;
  avatarUrl: string;
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
  };
}) {
  return authFetch("/api/user/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount() {
  return authFetch("/api/user/delete-account", {
    method: "DELETE",
  });
}
