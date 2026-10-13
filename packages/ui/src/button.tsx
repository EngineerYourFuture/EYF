import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brand";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Adds an accent glow — for hero / primary CTAs. */
  glow?: boolean;
};

const base =
  "ui-button inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-md touch-manipulation transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] active:duration-75 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:   "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "bg-surface-2 text-text-1 border border-border hover:border-edge hover:bg-surface-3",
  ghost:     "text-text-2 hover:text-text-1 hover:bg-surface-3",
  danger:    "bg-hard/10 text-hard border border-hard/30 hover:bg-hard/20",
  // The ONE key action per screen — brand red, used sparingly.
  brand:     "bg-brand text-brand-ink hover:bg-brand-hover",
};

const sizes: Record<Size, string> = {
  sm: "min-h-8 px-3 py-1.5 text-sm",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, type = "submit", ...props }, ref) => (
    <button
      type={type}
      ref={ref}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        glow && "shadow-glow-sm hover:shadow-glow",
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
