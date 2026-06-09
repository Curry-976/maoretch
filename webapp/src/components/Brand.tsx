type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
};

export function BrandLogo({ size = "md", className = "" }: { size?: Size; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Maore-Tech"
      className={`${sizes[size]} w-auto object-contain ${className}`}
      draggable={false}
    />
  );
}
