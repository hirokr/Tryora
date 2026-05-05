type VerificationHeaderProps = {
  userEmail: string;
};

export function VerificationHeader({ userEmail }: VerificationHeaderProps) {
  return (
    <>
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "#1e1a38", border: "2px solid #3b1f6a" }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>

      <h1 className="mb-3 text-4xl font-bold text-white">Check your inbox</h1>
      <p className="mb-8 text-center text-sm leading-relaxed text-gray-400">
        Verification link sent to <span className="text-purple-400">{userEmail}</span>
      </p>
    </>
  );
}
