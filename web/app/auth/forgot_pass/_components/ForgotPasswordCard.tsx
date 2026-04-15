import Link from "next/link";
import type { FormEvent } from "react";

type ForgotPasswordCardProps = {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ForgotPasswordCard({ email, onEmailChange, onSubmit }: ForgotPasswordCardProps) {
  return (
    <div
      className="w-full max-w-[380px] rounded-3xl p-6"
      style={{
        backgroundColor: "rgba(37, 27, 55, 0.85)",
        border: "1px solid #3a2f52",
        boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
      }}
    >
      <h1 className="mb-3 font-serif text-3xl text-white">Forgot Password</h1>
      <p className="mb-6 text-sm leading-relaxed text-gray-400">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="alex@example.com"
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-1 focus:ring-purple-500"
            style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
          />
        </div>

        <button
          type="submit"
          className="h-10 w-full rounded-2xl bg-[#8b3cf7] text-sm font-semibold text-white transition-colors hover:bg-[#7b2fe0]"
        >
          Send Reset Link
        </button>
      </form>

      <Link
        href="/auth/signin"
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#6b5a86] py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-white hover:text-black"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
