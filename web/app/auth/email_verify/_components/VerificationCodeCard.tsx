import Link from "next/link";

type VerificationCodeCardProps = {
  code: string[];
  onChangeDigit: (value: string, idx: number) => void;
  onKeyDownDigit: (event: React.KeyboardEvent<HTMLInputElement>, idx: number) => void;
  setInputRef: (element: HTMLInputElement | null, index: number) => void;
};

export function VerificationCodeCard({
  code,
  onChangeDigit,
  onKeyDownDigit,
  setInputRef,
}: VerificationCodeCardProps) {
  return (
    <div className="w-full max-w-sm rounded-2xl p-7" style={{ backgroundColor: "#13102a", border: "1px solid #2a2540" }}>
      <p className="mb-5 text-center text-xs uppercase tracking-widest text-gray-500">Or enter code manually</p>

      <div className="mb-6 flex justify-center gap-2">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(element) => setInputRef(element, index)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => onChangeDigit(event.target.value, index)}
            onKeyDown={(event) => onKeyDownDigit(event, index)}
            className="h-12 w-11 rounded-xl text-center text-lg font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ backgroundColor: "#0f0c22", border: "1px solid #2a2540" }}
          />
        ))}
      </div>

      <Link
        href="/auth/reset_pass"
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#8b3cf7" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Verify Account
      </Link>

      <p className="text-center text-xs text-gray-500">
        Didn&apos;t receive the email?{" "}
        <a href="#" className="text-purple-400 transition-colors hover:text-purple-300">Resend Email</a>
      </p>
    </div>
  );
}
