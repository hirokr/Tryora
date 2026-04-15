"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/ui/submitButton";

type SignUpFormProps = {
  state: any;
  action: (formData: FormData) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
};

export default function SignUpForm({
  state,
  action,
  showPassword,
  onTogglePassword,
}: SignUpFormProps) {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-6">
      <div className="flex w-full max-w-[900px] flex-col items-start justify-center gap-8 lg:flex-row">
        <div
          className="w-full max-w-[340px] rounded-3xl p-5"
          style={{
            backgroundColor: "rgba(37, 27, 55, 0.85)",
            border: "1px solid #3a2f52",
            boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
          }}
        >
          <h1 className="mb-3 font-serif text-3xl leading-tight text-white">Join Tryora</h1>
          <p className="mb-10 text-sm leading-relaxed text-gray-400">
            Create your account to unlock advanced AI avatar
            <br />
            generation.
          </p>

          <form className="space-y-5" action={action}>
            {state?.message && <p className="text-sm text-red-400">{state.message}</p>}

            <div>
              <Label htmlFor="name" className="mb-2 block text-sm text-gray-300">
                Full Name
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-1 focus:ring-purple-500"
                  style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
                />
              </div>
            </div>
            {state?.error?.name && <p className="text-sm text-red-400">{state.error.name[0]}</p>}

            <div>
              <Label htmlFor="email" className="mb-2 block text-sm text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="alex@example.com"
                  className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-1 focus:ring-purple-500"
                  style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
                />
              </div>
            </div>
            {state?.error?.email && <p className="text-sm text-red-400">{state.error.email[0]}</p>}

            <div>
              <Label htmlFor="phone" className="mb-2 block text-sm text-gray-300">
                Phone Number
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                    <path d="M12 18h.01" />
                  </svg>
                </span>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-1 focus:ring-purple-500"
                  style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block text-sm text-gray-300">
                Password
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  className="w-full rounded-2xl py-3 pl-10 pr-11 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-1 focus:ring-purple-500"
                  style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
            {state?.error?.password && <p className="text-sm text-red-400">{state.error.password[0]}</p>}

            <SubmitButton className="mt-2 h-10 w-full rounded-2xl bg-[#8b3cf7] text-sm font-semibold text-white hover:bg-[#7b2fe0]">
              Create Account
            </SubmitButton>
          </form>

          <div className="my-6 h-px w-full" style={{ backgroundColor: "#3a2f52" }}></div>
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-semibold text-purple-400 hover:text-purple-300">
              Log in
            </Link>
          </p>
        </div>

        <div className="hidden flex-col gap-6 rounded-3xl p-5 lg:flex lg:w-[340px]" style={{ backgroundColor: "rgba(37, 27, 55, 0.85)", border: "1px solid #3a2f52" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">Creator Onboarding</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Build your digital presence with Tryora</h2>
          </div>

          <div className="min-h-[170px] space-y-4">
            <p className="typewriter-line line-1 text-sm text-gray-300">Your avatar, tailored to your style language.</p>
            <p className="typewriter-line line-2 text-sm text-gray-300">Studio-grade rendering powered by AI precision.</p>
            <p className="typewriter-line line-3 text-sm text-gray-300">Launch looks faster with creator-first workflows.</p>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: "#0f0c22", border: "1px solid #2a2540" }}>
            <p className="text-sm leading-relaxed text-gray-400">
              From concept to virtual runway, Tryora helps you move from idea to impact without compromising aesthetic quality.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .typewriter-line {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          border-right: 2px solid #8b3cf7;
          animation-name: typing;
          animation-duration: 1.8s;
          animation-timing-function: steps(46, end);
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
        }

        .line-1 {
          animation-delay: 0s;
        }

        .line-2 {
          animation-delay: 2.1s;
        }

        .line-3 {
          animation-delay: 4.2s;
        }

        @keyframes typing {
          0% {
            width: 0;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
