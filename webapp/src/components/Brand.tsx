type Size = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

const sizes: Record<Size, string> = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
  xl: "h-20",
  hero: "h-28",
};

export function BrandLogo({ size = "md", className = "" }: { size?: Size; className?: string }) {
  return (
    <img
      src="/logo.jpg"
      alt="Maore-Tech"
      className={`${sizes[size]} w-auto object-contain ${className}`}
      draggable={false}
    />
  );
}
