// Composed cover for templates that don't have a staged cover-book photo yet (coverImageSrc is
// null in designTokens.ts) — fills the same `relative aspect-[1748/1240]` slot the real
// <Image fill> covers use, so it's a drop-in swap wherever visuals.coverImageSrc is checked.
export function TemplateCoverArt({
  name,
  accent,
  tint,
  imageSrc,
}: {
  name: string
  accent: string
  tint: string
  imageSrc: string
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center" style={{ backgroundColor: tint }}>
      <img src={imageSrc} alt="" className="h-[55%] w-auto object-contain" />
      <div className="text-[15px] leading-tight font-bold italic" style={{ fontFamily: 'var(--font-playfair)', color: accent }}>
        {name}
      </div>
    </div>
  )
}
