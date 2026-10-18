import type { PersistedExperienceState } from '../persistence/experiencePersistence.ts';

export type WalkStopCompletion = Readonly<{
  next: PersistedExperienceState;
  finalStep: boolean;
}>;

/**
 * Computes one walk-progress revision without modifying its source state.
 * Completion only applies to the actual active stop of the current walk.
 * Persist the entire revision before publishing it to the UI or analytics.
 */
export function planWalkStopCompletion(
  current: PersistedExperienceState,
  placeId: string
): WalkStopCompletion {
  const activeStop = current.routeStopIds[current.routeStep];
  if (!placeId || !activeStop || activeStop !== placeId || current.routeFinished) {
    throw new Error('Only the active unfinished walk stop can be completed');
  }
  if (current.routeCompletedStopIds.includes(placeId)) {
    throw new Error('Walk stop is already completed');
  }
  const finalStep = current.routeStep === current.routeStopIds.length - 1;
  return {
    next: {
      ...current,
      visitedIds: current.visitedIds.includes(placeId)
        ? [...current.visitedIds]
        : [...current.visitedIds, placeId],
      routeCompletedStopIds: [...current.routeCompletedStopIds, placeId],
      routeStep: finalStep ? current.routeStep : current.routeStep + 1,
      routeFinished: finalStep
    },
    finalStep
  };
}
