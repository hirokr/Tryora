"use client";

import { useEffect, useState } from "react";

import type { UserProfile } from "../../../../types/dashboardtypes";

type ProfileProps = {
  user: UserProfile | null;
  publicTryonsCount: number;
  onSave: (payload: {
    name: string;
    email: string;
    avatarUrl: string;
    demographics: {
      ageRange: string;
      gender: string;
      location: string;
    };
  }) => Promise<void>;
  onResetPassword: () => void;
  onDeleteAccount: () => Promise<void>;
  isBusy: boolean;
};

export function Profile({
  user,
  publicTryonsCount,
  onSave,
  onResetPassword,
  onDeleteAccount,
  isBusy,
}: ProfileProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setAvatarUrl(user?.avatarUrl || "");
    setAgeRange(user?.demographics?.ageRange || "");
    setGender(user?.demographics?.gender || "");
    setLocation(user?.demographics?.location || "");
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    await onSave({
      name,
      email,
      avatarUrl,
      demographics: {
        ageRange,
        gender,
        location,
      },
    });

    setMessage("Profile updated.");
  };

  const handleLocalUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setUploadPreview(objectUrl);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151124] p-5 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Update Profile</p>
          <h2 className="mt-2 text-2xl font-semibold">Profile settings</h2>
          <p className="mt-1 text-sm text-slate-300">Change image, name, email, password, demographic data, and visibility settings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <input
            value={ageRange}
            onChange={(event) => setAgeRange(event.target.value)}
            placeholder="Demographic: age range"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <input
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            placeholder="Demographic: gender"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Demographic: location"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none sm:col-span-2"
          />
        </div>

        <div className="rounded-xl border border-white/15 p-4">
          <p className="text-sm font-semibold">Profile image</p>
          <p className="mt-1 text-xs text-slate-300">Upload place is available here for profile picture preview.</p>

          <div className="mt-3 flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-slate-700/40">
              {uploadPreview || avatarUrl ? (
                <img src={uploadPreview || avatarUrl} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-200">Upload</div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleLocalUpload} className="text-sm" />
          </div>

          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="Or paste image URL"
            className="mt-3 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="rounded-xl border border-white/15 p-4 text-sm text-slate-200">
          Publicly available try-ons: <span className="font-semibold text-white">{publicTryonsCount}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#052130] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save profile
          </button>
          <button
            type="button"
            onClick={onResetPassword}
            className="rounded-lg border border-amber-300/35 px-4 py-2 text-sm font-semibold text-amber-200"
          >
            Reset pass
          </button>
          <button
            type="button"
            onClick={() => void onDeleteAccount()}
            disabled={isBusy}
            className="rounded-lg border border-red-400/45 px-4 py-2 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete account
          </button>
        </div>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </form>
    </section>
  );
}
