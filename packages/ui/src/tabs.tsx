import { type ReactNode, type KeyboardEvent } from "react";
import { cn } from "./cn";

export type TabsProps<T extends string> = {
  /** Ordered tab ids. The id is rendered as the label (capitalised via CSS). */
  tabs: readonly T[];
  value: T;
  onChange: (id: T) => void;
  /** Prefix for the generated tab/panel ids — must be unique per Tabs on a page. */
  idBase: string;
  "aria-label": string;
  className?: string;
};

/**
 * WAI-ARIA tabs — the tablist half. Implements the full keyboard model
 * (←/→ move, Home/End jump) with roving tabindex + focus management. Pair with
 * <TabPanel> using the same `idBase`. Extracted so the pattern is written once
 * instead of re-implemented per screen.
 */
export function Tabs<T extends string>({ tabs, value, onChange, idBase, className, ...rest }: Readonly<TabsProps<T>>) {
  function onKeyDown(e: KeyboardEvent) {
    const i = tabs.indexOf(value);
    let next: number;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    const id = tabs[next]!;
    onChange(id);
    document.getElementById(`${idBase}-tab-${id}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn("flex items-center gap-1 border-b border-border", className)}
    >
      {tabs.map((t) => {
        const selected = t === value;
        return (
          <button
            key={t}
            id={`${idBase}-tab-${t}`}
            role="tab"
            aria-selected={selected}
            aria-controls={`${idBase}-panel`}
            tabIndex={selected ? 0 : -1}
            onKeyDown={onKeyDown}
            onClick={() => onChange(t)}
            className={cn(
              "px-3 py-2 text-sm border-b-2 -mb-px capitalize transition-colors rounded-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              selected ? "border-accent text-text-1" : "border-transparent text-text-3 hover:text-text-1",
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/** The panel half of a Tabs widget. `idBase`/`value` must match its <Tabs>. */
export function TabPanel({
  idBase, value, children, className,
}: Readonly<{ idBase: string; value: string; children: ReactNode; className?: string }>) {
  return (
    <div
      id={`${idBase}-panel`}
      role="tabpanel"
      aria-labelledby={`${idBase}-tab-${value}`}
      tabIndex={0}
      className={cn("focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
