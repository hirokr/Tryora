"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function EmailVerifyPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [storedEmail, setStoredEmail] = useState("");
  const emailFromQuery = searchParams.get("email");
  const userEmail = emailFromQuery && emailFromQuery.trim() ? emailFromQuery : storedEmail || "your email";

  useEffect(() => {
    const sessionEmail = sessionStorage.getItem("authEmail") || "";
    setStoredEmail(sessionEmail);
  }, []);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  return (
    <div
      className="min-h-[86vh] mx-4 my-4 md:mx-6 md:my-6 flex rounded-3xl overflow-hidden"
      style={{
        background: "radial-gradient(1200px 600px at 20% 0%, #22103a 0%, #140b24 45%, #0d0b18 100%)",
      }}
    >
      {/* Main content */}
      <main className="w-full flex flex-col items-center justify-center px-6 py-8 md:py-10">
        {/* Mail icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "#1e1a38", border: "2px solid #3b1f6a" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Check your inbox</h1>
        <p className="text-gray-400 text-sm text-center leading-relaxed mb-8">
          Verification link sent to <span className="text-purple-400">{userEmail}</span>
        </p>

        {/* Code card */}
        <div className="w-full max-w-sm rounded-2xl p-7" style={{ backgroundColor: "#13102a", border: "1px solid #2a2540" }}>
          <p className="text-center text-xs text-gray-500 tracking-widest uppercase mb-5">Or enter code manually</p>

          {/* 6-digit input */}
          <div className="flex gap-2 justify-center mb-6">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-11 h-12 text-center text-white text-lg font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                style={{ backgroundColor: "#0f0c22", border: "1px solid #2a2540" }}
              />
            ))}
          </div>

          {/* Verify button */}
          <Link href="/auth/reset_pass"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-4"
            style={{ backgroundColor: "#8b3cf7" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Verify Account
          </Link>

          <p className="text-center text-xs text-gray-500">
            Didn&apos;t receive the email?{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Resend Email</a>
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center gap-2 text-xs text-gray-600 tracking-widest uppercase">
          <a href="#" className="hover:text-gray-400 transition-colors">Contact Support</a>
          <span></span>
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
        </div>
      </main>
    </div>
  );
}
