"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function ResetPasswordPage() {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const meetsLengthRequirement = newPassword.length >= 8;
  const meetsSpecialCharRequirement = /[^A-Za-z0-9]/.test(newPassword);

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${met ? "border-primary bg-primary/20" : "border-slate-500"}`}>
        {met && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 8.5L6.5 11.5L12.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
          </svg>
        )}
      </span>
      {text}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-display text-slate-100" style={{ backgroundColor: "#191022" }}>
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-primary/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-8 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Tryora</h1>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-xl bg-primary/5 shadow-2xl border border-primary/10">

          {/* Left  Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-4xl font-serif text-slate-100 mb-3">Reset Password</h2>
              <p className="text-slate-400">Create a new, strong password to secure your account.</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push("/auth/signin"); }}>
              {/* New Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder=""
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-100 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 3 18 18" />
                        <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.4 0 10 7 10 7a18.73 18.73 0 0 1-4.11 5.94" />
                        <path d="M6.61 6.61A18.7 18.7 0 0 0 2 12s3.6 7 10 7a10.94 10.94 0 0 0 5.09-1.17" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder=""
                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-100 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 3 18 18" />
                        <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.4 0 10 7 10 7a18.73 18.73 0 0 1-4.11 5.94" />
                        <path d="M6.61 6.61A18.7 18.7 0 0 0 2 12s3.6 7 10 7a10.94 10.94 0 0 0 5.09-1.17" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                <RequirementItem met={meetsLengthRequirement} text="At least 8 characters" />
                <RequirementItem met={meetsSpecialCharRequirement} text="One special character" />
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

          {/* Right  Image Panel */}
          <div className="hidden lg:flex relative ai-gradient items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}></div>
            <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
              <div className="w-full h-full rounded-2xl overflow-hidden glass-panel relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent z-10"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={"/reset_pass.png"}
                  alt="Futuristic high-gloss AI female avatar glowing with purple light"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background-dark to-transparent z-20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-1 w-8 bg-primary rounded-full inline-block"></span>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Secure Access</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-tight">Enhanced Security Protocols Active</h3>
                </div>
              </div>
            </div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 flex flex-col items-center gap-2 border-t border-primary/5">
        <div className="flex items-center gap-1 text-slate-400 text-sm">
          <span>Powered by</span>
          <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-primary to-purple-400">Gemini</span>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">© 2024 Tryora AI Systems</p>
      </footer>
    </div>
  );
}
