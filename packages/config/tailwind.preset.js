/**
 * EYF design tokens.
 * Dark-first, with a full light theme. Single brand accent (lime #E8FF47).
 *
 * Colors resolve to CSS variables (space-separated RGB channels) so that:
 *   - Tailwind opacity modifiers keep working  →  bg-accent/10, border-border/60
 *   - Light/dark themes swap by re-defining the variables in globals.css
 *
 * The "vibrant" layer (glows, gradients, elevated surfaces) lives in the
 * boxShadow / backgroundImage / colors extensions below.
 */

/** rgb(var) helper so every color supports `/<alpha>` opacity modifiers. */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:          v("bg"),
        "bg-2":      v("bg-2"),
        surface:     v("surface"),
        "surface-2": v("surface-2"),
        "surface-3": v("surface-3"),
        border:      v("border"),
        edge:        v("border-2"), // stronger hairline (avoids border-2 width collision)
        text: {
          1: v("text-1"),
          2: v("text-2"),
          3: v("text-3"),
          4: v("text-4"),
        },
        accent: {
          DEFAULT: v("accent"),
          hover:   v("accent-hover"),
          tint:    v("accent-tint"),
          ink:     v("accent-ink"), // readable text color ON an accent fill
        },
        // Brand red — the ONE accent, used sparingly (key CTA, active state, logo).
        brand: {
          DEFAULT: v("brand"),
          hover:   v("brand-hover"),
          ink:     v("brand-ink"),
        },
        // semantic difficulty / status
        easy:    v("easy"),
        medium:  v("medium"),
        hard:    v("hard"),
        expert:  v("expert"),
        info:    v("info"),
      },
      fontFamily: {
        display: ["Geist", "ui-sans-serif", "system-ui"],
        sans:    ["Geist", "ui-sans-serif", "system-ui"],
        mono:    ["Geist Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      spacing: {
        "4.5": "1.125rem",
      },
      borderRadius: {
        none:  "0",
        sm:    "4px",
        md:    "8px",
        lg:    "12px",
        xl:    "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        // Soft, layered elevation (Stripe/Linear-grade) — multiple low-opacity
        // layers read premium; a single hard shadow reads cheap. On dark the
        // near-black --shadow keeps these barely-there, so borders carry depth.
        card:       "0 1px 2px -1px rgb(var(--shadow) / 0.10), 0 4px 12px -3px rgb(var(--shadow) / 0.08), 0 12px 28px -8px rgb(var(--shadow) / 0.08)",
        "card-lg":  "0 2px 4px -2px rgb(var(--shadow) / 0.10), 0 8px 20px -4px rgb(var(--shadow) / 0.10), 0 28px 56px -12px rgb(var(--shadow) / 0.14)",
        // "glow" kept as an alias for back-compat but neutralized (no neon).
        glow:       "0 1px 2px -1px rgb(var(--shadow) / 0.10), 0 12px 32px -10px rgb(var(--shadow) / 0.14)",
        "glow-sm":  "0 6px 18px -8px rgb(var(--shadow) / 0.16)",
        inset:      "inset 0 1px 0 0 rgb(var(--hairline) / 0.06)",
      },
      backgroundImage: {
        // Monochrome only — no colored/decorative gradients. accent-grad and
        // glow-radial kept as neutral aliases (back-compat) so existing usages
        // degrade to premium monochrome instead of vanishing.
        "accent-grad":  "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-hover)) 100%)",
        "surface-grad": "linear-gradient(180deg, rgb(var(--surface-2)) 0%, rgb(var(--surface)) 100%)",
        "glow-radial":  "radial-gradient(60% 80% at 50% 0%, rgb(var(--hairline) / 0.05) 0%, transparent 70%)",
        "hairline":     "linear-gradient(90deg, transparent, rgb(var(--border-2)), transparent)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
