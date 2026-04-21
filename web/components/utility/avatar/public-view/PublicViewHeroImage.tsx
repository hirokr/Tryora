type PublicViewHeroImageProps = {
  imageUrl: string;
  imageError: string | null;
};

export function PublicViewHeroImage({ imageUrl, imageError }: PublicViewHeroImageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="relative h-[420px] w-full max-w-4xl overflow-hidden rounded-3xl border border-primary/10 md:h-[500px] lg:h-[560px]">
        <img className="h-full w-full object-cover" src={imageUrl} alt="Public avatar render" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          Public View
        </div>
      </div>
      {imageError ? <p className="mt-3 text-sm text-red-300">{imageError}</p> : null}
    </div>
  );
}
