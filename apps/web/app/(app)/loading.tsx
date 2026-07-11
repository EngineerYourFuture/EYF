import { SkeletonCards } from "@eyf/ui";

/** Route-segment loading UI for every /(app) route — shown instantly on
 *  navigation so users see structure, not a blank frame, on slow networks. */
export default function AppLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-7xl mx-auto">
      <div className="h-9 w-56 rounded-md shimmer bg-surface-3/70" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-md shimmer bg-surface-3/70" />
      <div className="mt-8">
        <SkeletonCards count={6} />
      </div>
    </div>
  );
}
