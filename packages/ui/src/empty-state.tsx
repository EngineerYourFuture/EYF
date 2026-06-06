import { type ReactNode } from "react";
import { cn } from "./cn";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Consistent empty state — used when a list/section has no data yet. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("border border-dashed border-border rounded-xl py-14 px-6 text-center", className)}>
      {icon && <div className="text-4xl mb-3 opacity-70">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-text-1">{title}</h3>
      {description && <p className="text-text-3 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Inline error state with the same visual language. */
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="border border-hard/30 bg-hard/5 rounded-xl py-10 px-6 text-center">
      <div className="text-3xl mb-2">⚠</div>
      <p className="text-text-2 text-sm">{message}</p>
      {retry && (
        <button onClick={retry} className="mt-4 text-accent text-sm hover:underline">Try again</button>
      )}
    </div>
  );
}
