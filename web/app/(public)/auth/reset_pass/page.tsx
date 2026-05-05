"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordInputField } from "./_components/PasswordInputField";
import { PasswordRequirementItem } from "./_components/PasswordRequirementItem";
import { ResetPasswordVisualPanel } from "./_components/ResetPasswordVisualPanel";


export default function ResetPasswordPage() {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const meetsLengthRequirement = newPassword.length >= 8;
  const meetsSpecialCharRequirement = /[^A-Za-z0-9]/.test(newPassword);

  return (
    <div className="flex min-h-full items-center justify-center p-2 text-slate-100">
      <main className="w-full max-w-5xl p-2">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-xl bg-primary/5 shadow-2xl border border-primary/10">

          {/* Left  Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-4xl font-serif text-slate-100 mb-3">Reset Password</h2>
              <p className="text-slate-400">Create a new, strong password to secure your account.</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push("/auth/signin"); }}>
              {/* New Password */}
              <PasswordInputField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNew}
                onToggleVisibility={() => setShowNew(!showNew)}
              />

              {/* Confirm Password */}
              <PasswordInputField
                label="Confirm New Password"
                visible={showConfirm}
                onToggleVisibility={() => setShowConfirm(!showConfirm)}
              />

              {/* Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                <PasswordRequirementItem met={meetsLengthRequirement} text="At least 8 characters" />
                <PasswordRequirementItem met={meetsSpecialCharRequirement} text="One special character" />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Reset Password
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/auth/signin" className="inline-flex items-center justify-center rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                Back to Sign In
              </Link>
            </div>
          </div>

          <ResetPasswordVisualPanel />

        </div>
      </main>
    </div>
  );
}
