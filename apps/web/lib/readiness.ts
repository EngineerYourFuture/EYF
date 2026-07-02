/**
 * Placement Readiness — web view of the shared, pure engine in @eyf/types.
 *
 * The computation lives in @eyf/types/readiness (one implementation, shared
 * with the API guidance service — DRY). Here we only re-type `icon` from the
 * shared `string` to the web's `IconName` union at the boundary, since every
 * icon the engine emits is a valid IconName. No behavior lives in this file.
 */
import {
  computeReadiness as computeReadinessShared,
  rankActions as rankActionsShared,
  type ReadinessInput,
  type Readiness as SharedReadiness,
  type Pillar as SharedPillar,
  type GuidanceAction as SharedGuidanceAction,
} from "@eyf/types";
import type { IconName } from "@/components/icons";

export type { ReadinessInput };
export type Pillar = Omit<SharedPillar, "icon"> & { icon: IconName };
export type Readiness = Omit<SharedReadiness, "pillars" | "nextActions"> & {
  pillars: Pillar[];
  nextActions: { label: string; detail: string; href: string; icon: IconName }[];
};
export type GuidanceAction = Omit<SharedGuidanceAction, "icon"> & { icon: IconName };

// The engine emits IconName-valued strings; the cast is safe at this boundary.
export const computeReadiness = computeReadinessShared as (i: ReadinessInput) => Readiness;
export const rankActions = rankActionsShared as (r: Readiness, limit?: number) => GuidanceAction[];
