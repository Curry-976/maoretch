import { BrandSVG } from "./BrandSVG";

type Size = "sm" | "md" | "lg";
type Variant = "full" | "mark";

const fullSizes: Record<Size, string> = {
  sm: "h-7",
  md: "h-10",
  lg: "h-16",
};

const markSizes: Record<Size, string> = {
  sm: "h-7 w-auto",
  md: "h-9 w-auto",
  lg: "h-12 w-auto",
};

export function BrandLogo({
  size = "md",
  variant = "full",
  tone = "brand",
  className = "",
}: {
  size?: Size;
  variant?: Variant;
  tone?: "brand" | "light";
  className?: string;
}) {
  const sizeClass = variant === "mark" ? markSizes[size] : fullSizes[size];
  return <BrandSVG variant={variant} tone={tone} className={`${sizeClass} w-auto ${className}`} />;
}
