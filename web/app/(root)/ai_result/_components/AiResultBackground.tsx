export function AiResultBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, rgba(140,43,238,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(140,43,238,0.1) 0%, transparent 40%)",
      }}
    />
  );
}
