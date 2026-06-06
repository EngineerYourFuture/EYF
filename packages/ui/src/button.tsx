import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Adds an accent glow — for hero / primary CTAs. */
  glow?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-md transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:   "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "bg-surface-2 text-text-1 border border-border hover:border-edge hover:bg-surface-3",
  ghost:     "text-text-2 hover:text-text-1 hover:bg-surface-3",
  danger:    "bg-hard/10 text-hard border border-hard/30 hover:bg-hard/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, ...props }, ref) => (
    <button
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
