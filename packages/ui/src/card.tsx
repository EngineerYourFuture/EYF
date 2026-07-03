import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type CardVariant = "default" | "elevated" | "glow" | "bare" | "glass";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  /** Adds a hover lift + border highlight; use for clickable cards. */
  interactive?: boolean;
};

const variants: Record<CardVariant, string> = {
  default:  "bg-surface border border-border shadow-card",
  elevated: "bg-surface-grad border border-edge shadow-card-lg",
  glow:     "bg-surface border border-accent/30 shadow-glow",
  bare:     "bg-surface border border-border",
  // Frosted vibrancy — for panels that sit over textured/scrolling backgrounds.
  glass:    "glass border shadow-card",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl p-6",
        variants[variant],
        interactive && "card-interactive cursor-pointer",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";
