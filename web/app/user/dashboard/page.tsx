"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardMetrics } from "./_components/DashboardMetrics";
import { deleteAccount, fetchDashboardData, updateProfile } from "./_components/dashboardApi";
import { MeAndMyselfSection } from "./_components/MeAndMyselfSection";
import { Profile } from "./_components/Profile";
import type { DashboardMetrics as DashboardMetricsData, MeAndMyselfImage, UserProfile } from "../../../types/dashboardtypes";
import type { ProfileUpdatePayload } from "./_components/dashboardApi";

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetricsData>({
    favouriteCount: 0,
    tryonImagesCount: 0,
    wardrobeItemsCount: 0,
  });
  const [publicTryonsCount, setPublicTryonsCount] = useState(0);
  const [gallery, setGallery] = useState<MeAndMyselfImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardData();
        setProfile(data.profile);
        setMetrics(data.metrics);
        setGallery(data.gallery);
        setPublicTryonsCount(data.publicTryonsCount);
      } catch {
        setError("Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleSaveProfile = async (payload: ProfileUpdatePayload): Promise<boolean> => {
    setIsBusy(true);
    setError(null);

    try {
      const response = await updateProfile(payload);

      if (!response.ok) {
        setError("Failed to update profile.");
        return false;
      }

      setProfile((current) => {
        if (!current) return current;

        return {
          ...current,
          name: payload.name,
          gender: payload.gender,
          age: typeof payload.age === "number" ? payload.age : current.age,
          interests: Array.isArray(payload.interests) ? payload.interests : current.interests,
          avatarUrl: payload.avatarUrl || current.avatarUrl,
        };
      });

      return true;
    } catch {
      setError("Failed to update profile.");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);

    try {
      const response = await deleteAccount();

      if (!response.ok) {
        setError("Failed to delete account.");
        return;
      }

      router.push("/auth/signin");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen overflow-y-auto bg-[#0f0a1b] pt-20 text-slate-100">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-linear-to-r from-[#1b1327] via-[#22163b] to-[#1e2d3a] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Dashboard</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Welcome back, {profile?.name || "User"}</h1>
          <p className="mt-2 text-sm text-slate-200">Your dashboard now focuses on favourites, try-ons, wardrobe usage, profile update, and Me &amp; Myself images.</p>
        </header>

        <DashboardMetrics metrics={metrics} />

        <Profile
          user={profile}
          publicTryonsCount={publicTryonsCount}
          onSave={handleSaveProfile}
          onResetPassword={() => router.push("/auth/reset_pass")}
          onDeleteAccount={handleDeleteAccount}
          isBusy={isBusy}
        />

        <MeAndMyselfSection images={gallery} isLoading={isLoading} error={error} />

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    </main>
  );
}
