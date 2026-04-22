"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { UploadButton } from "@/utils/uploadthing";

import type { UserProfile } from "../../../../types/dashboardtypes";

type ProfilePayload = {
  name: string;
  gender: string;
  age?: number;
  interests?: string[];
  avatarUrl?: string;
};

type ProfileProps = {
  user: UserProfile | null;
  publicTryonsCount: number;
  onSave: (payload: ProfilePayload) => Promise<boolean>;
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
  const formRef = useRef<HTMLFormElement | null>(null);

  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resolvedAvatarUrl = uploadedAvatarUrl || user?.avatarUrl || "";

  const buildPayload = (nextAvatarUrl?: string): ProfilePayload => {
    const formData = formRef.current ? new FormData(formRef.current) : null;

    const name = String(formData?.get("name") || user?.name || "").trim();
    const gender = String(formData?.get("gender") || user?.gender || user?.demographics?.gender || "UNISEX").trim();
    const rawAge = String(formData?.get("age") || "").trim();
    const parsedAge = rawAge.length > 0 ? Number(rawAge) : undefined;
    const interestsText = String(formData?.get("interests") || "").trim();

    return {
      name,
      gender,
      age: typeof parsedAge === "number" && Number.isFinite(parsedAge) ? parsedAge : undefined,
      interests: interestsText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      avatarUrl: nextAvatarUrl || resolvedAvatarUrl || undefined,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const ok = await onSave(buildPayload());
    setMessage(ok ? "Profile updated." : "Failed to update profile.");
  };

  return (
    <section key={user?.id || "profile-empty"} className="rounded-2xl border border-white/10 bg-[#151124] p-5 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Update Profile</p>
          <h2 className="mt-2 text-2xl font-semibold">Profile settings</h2>
          <p className="mt-1 text-sm text-slate-300">Update your name, gender, age, interests, and avatar.</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-white/15 p-4 text-sm text-slate-200">
        <p className="mb-2 text-sm font-semibold text-white">Account data</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <p>Name: <span className="text-white">{user?.name || "-"}</span></p>
          <p>Email: <span className="text-white">{user?.email || "-"}</span></p>
          <p>Gender: <span className="text-white">{user?.gender || "-"}</span></p>
          <p>Age: <span className="text-white">{typeof user?.age === "number" ? user.age : "-"}</span></p>
          <p>Location: <span className="text-white">{user?.location || "-"}</span></p>
          <p>Email verified: <span className="text-white">{user?.emailVerified ? "Yes" : "No"}</span></p>
          <p>Active: <span className="text-white">{user?.isActive ? "Yes" : "No"}</span></p>
          <p>Interests: <span className="text-white">{user?.interests?.length ?? 0}</span></p>
          <p className="sm:col-span-2 break-all">User ID: <span className="text-white">{user?.id || "-"}</span></p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-white/15 p-4 text-sm text-slate-200">
        <p className="mb-3 text-sm font-semibold text-white">Avatar</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20 bg-white/5">
            {resolvedAvatarUrl ? (
              <Image src={resolvedAvatarUrl} alt="User avatar" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No avatar</div>
            )}
          </div>

          <div className="flex-1">
            <UploadButton
              endpoint="imageUploader"
              appearance={{
                button:
                  "ut-ready:mt-0 ut-uploading:cursor-not-allowed rounded-lg border border-cyan-200/40 bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#052130] transition-colors hover:bg-cyan-200 ut-uploading:opacity-60",
                allowedContent: "text-xs text-slate-400",
              }}
              content={{
                button: ({ isUploading }) => (isUploading ? "Uploading avatar..." : "Upload avatar"),
              }}
              onUploadBegin={() => {
                setIsAvatarUploading(true);
                setMessage(null);
              }}
              onClientUploadComplete={async (result) => {
                const nextAvatarUrl = result?.[0]?.ufsUrl || result?.[0]?.url;
                setIsAvatarUploading(false);

                if (!nextAvatarUrl) {
                  setMessage("Upload completed, but no avatar URL was returned.");
                  return;
                }

                setUploadedAvatarUrl(nextAvatarUrl);
                const ok = await onSave(buildPayload(nextAvatarUrl));
                setMessage(ok ? "Avatar uploaded and saved." : "Avatar uploaded, but saving failed.");
              }}
              onUploadError={(error: Error) => {
                setIsAvatarUploading(false);
                setMessage(error.message || "Failed to upload avatar.");
              }}
            />
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="name"
            defaultValue={user?.name || ""}
            placeholder="Name"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <select
            name="gender"
            defaultValue={user?.gender || user?.demographics?.gender || "UNISEX"}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="UNISEX" className="bg-[#151124]">UNISEX</option>
            <option value="MALE" className="bg-[#151124]">MALE</option>
            <option value="FEMALE" className="bg-[#151124]">FEMALE</option>
            <option value="OTHER" className="bg-[#151124]">OTHER</option>
          </select>
          <input
            name="age"
            defaultValue={typeof user?.age === "number" ? String(user.age) : ""}
            type="number"
            min={0}
            placeholder="Age"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <input
            name="interests"
            defaultValue={Array.isArray(user?.interests) ? user.interests.join(", ") : ""}
            placeholder="Interests (comma separated)"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="rounded-xl border border-white/15 p-4 text-sm text-slate-200">
          Publicly available try-ons: <span className="font-semibold text-white">{publicTryonsCount}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isBusy || isAvatarUploading}
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
