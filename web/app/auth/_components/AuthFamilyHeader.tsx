import Link from "next/link";

export function AuthFamilyHeader() {
  return (
    <header className="w-full border-b border-primary/10 px-6 py-4 md:px-14">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(145deg, #8b3cf7, #6d28d9)" }}
          >
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2L16.5 10.5L25 8L18.5 14L25 20L16.5 17.5L14 26L11.5 17.5L3 20L9.5 14L3 8L11.5 10.5L14 2Z" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Tryora</span>
        </Link>

        
      </div>
    </header>
  );
}
