"use client";

import { useEffect, useState } from "react";

import type { UserProfile } from "../../../../types/dashboardtypes";

type ProfileProps = {
  user: UserProfile | null;
  publicTryonsCount: number;
  onSave: (payload: {
    name: string;
    gender: string;
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
  const [gender, setGender] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setGender(user?.gender || user?.demographics?.gender || "UNISEX");
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    await onSave({
      name,
      gender,
    });

    setMessage("Profile updated.");
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151124] p-5 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Update Profile</p>
          <h2 className="mt-2 text-2xl font-semibold">Profile settings</h2>
          <p className="mt-1 text-sm text-slate-300">View your real account data and update only name and gender.</p>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            <option value="UNISEX" className="bg-[#151124]">UNISEX</option>
            <option value="MALE" className="bg-[#151124]">MALE</option>
            <option value="FEMALE" className="bg-[#151124]">FEMALE</option>
            <option value="OTHER" className="bg-[#151124]">OTHER</option>
          </select>
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
