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
        // semantic difficulty / status
        easy:    v("easy"),
        medium:  v("medium"),
        hard:    v("hard"),
        expert:  v("expert"),
        info:    v("info"),
      },
      fontFamily: {
        display: ["Geist", "Inter", "ui-sans-serif", "system-ui"],
        sans:    ["Inter", "ui-sans-serif", "system-ui"],
        mono:    ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
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
        // subtle elevation that reads on both themes (var-driven)
        card:       "0 1px 2px rgb(var(--shadow) / 0.30), 0 8px 24px -12px rgb(var(--shadow) / 0.45)",
        "card-lg":  "0 1px 2px rgb(var(--shadow) / 0.30), 0 24px 48px -16px rgb(var(--shadow) / 0.55)",
        // accent glow for hero / interactive moments
        glow:       "0 0 0 1px rgb(var(--accent) / 0.25), 0 8px 40px -8px rgb(var(--accent) / 0.35)",
        "glow-sm":  "0 0 24px -6px rgb(var(--accent) / 0.45)",
        inset:      "inset 0 1px 0 0 rgb(var(--hairline) / 0.06)",
      },
      backgroundImage: {
        // tasteful, restrained gradients (the "vibrant" layer)
        "accent-grad": "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-hover)) 100%)",
        "surface-grad": "linear-gradient(180deg, rgb(var(--surface-2)) 0%, rgb(var(--surface)) 100%)",
        "glow-radial": "radial-gradient(60% 80% at 50% 0%, rgb(var(--accent) / 0.10) 0%, transparent 70%)",
        "hairline":   "linear-gradient(90deg, transparent, rgb(var(--border-2)), transparent)",
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
