import { type ReactNode } from "react";
import { cn } from "./cn";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Neutral inbox glyph — the default when a caller doesn't supply an icon.
 *  A monochrome SVG (not an emoji) so it inherits color, size and theme. */
function DefaultIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12h4l2 3h6l2-3h4" />
      <path d="M5 6h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

/** Consistent empty state — used when a list/section has no data yet. */
export function EmptyState({ icon, title, description, action, className }: Readonly<EmptyStateProps>) {
  return (
    <div className={cn("border border-dashed border-border rounded-xl py-14 px-6 text-center", className)}>
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-2 text-text-3">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="font-display text-lg font-bold text-text-1">{title}</h3>
      {description && <p className="text-text-3 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Inline error state with the same visual language and a clear recovery path. */
export function ErrorState({
  title = "Couldn’t load this",
  message,
  retry,
}: Readonly<{
  title?: string;
  message: string;
  retry?: () => void;
}>) {
  return (
    <div className="border border-hard/30 bg-hard/5 rounded-xl py-10 px-6 text-center" role="alert">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-hard/30 bg-hard/10 text-hard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <h3 className="font-display text-base font-bold text-text-1">{title}</h3>
      <p className="text-text-2 text-sm mt-1 max-w-sm mx-auto leading-relaxed">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-surface-2 border border-border text-text-1 text-sm hover:border-edge hover:bg-surface-3 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}
