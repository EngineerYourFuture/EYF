/**
 * Page entrance is now handled globally by the route transition in AppShell
 * (fires on every navigation, for every page). This stays as a passthrough so
 * existing `<PageMotion>` usages keep their layout without double-animating.
 */
export function PageMotion({ children, className }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={className}>{children}</div>;
}
