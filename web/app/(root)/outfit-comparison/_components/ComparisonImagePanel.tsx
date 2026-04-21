type ComparisonImagePanelProps = {
  title: string;
  imageUrl: string | null;
  emptyHint: string;
  mirrored?: boolean;
};

const glass = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  border: "0.5px solid rgba(255,255,255,0.1)",
} as React.CSSProperties;

export function ComparisonImagePanel({
  title,
  imageUrl,
  emptyHint,
  mirrored = false,
}: ComparisonImagePanelProps) {
  return (
    <section className="group relative flex-1 border-primary/30 first:border-r">
      <div className="flex h-full min-h-[360px] items-center justify-center p-6">
        {imageUrl ? (
          <img
            className="max-h-[72vh] rounded-xl object-contain"
            style={mirrored ? { transform: "scaleX(-1)" } : undefined}
            src={imageUrl}
            alt={title}
          />
        ) : (
          <p className="max-w-xs text-center text-sm text-slate-300">{emptyHint}</p>
        )}
      </div>
      <div
        className="absolute left-6 top-6 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
        style={glass}
      >
        {title}
      </div>
    </section>
  );
}
