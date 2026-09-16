export const motion = {
  duration: {
    instant: 80,
    fast: 140,
    medium: 220,
    slow: 340
  },
  spring: {
    firm: {
      damping: 24,
      stiffness: 260,
      mass: 0.82
    },
    soft: {
      damping: 22,
      stiffness: 190,
      mass: 0.9
    },
    lock: {
      damping: 28,
      stiffness: 340,
      mass: 0.72
    }
  },
  scale: {
    press: 0.985,
    strongPress: 0.975,
    maxCoreOvershoot: 1.015
  },
  opacity: {
    disabled: 0.42,
    secondaryInactive: 0.68,
    backdropMin: 0.54,
    backdropMax: 0.72
  },
  touch: {
    minimumTarget: 44,
    outdoorTarget: 50
  },
  rubberBand: {
    linearPx: 24,
    resistance: 0.38
  },
  sheet: {
    velocityCommit: 620,
    displacementCommitRatio: 0.32
  }
} as const;

export type InteractionPhase =
  | 'idle'
  | 'press-in'
  | 'active'
  | 'dragging'
  | 'release'
  | 'settle'
  | 'loading'
  | 'locked'
  | 'success'
  | 'error'
  | 'disabled';

export type StableSheetState = 'collapsed' | 'preview' | 'expanded';

export type SnapPoint = {
  state: StableSheetState;
  position: number;
};

function nearestSnapIndex(position: number, ordered: readonly SnapPoint[]) {
  let bestIndex = 0;
  let bestDistance = Math.abs((ordered[0]?.position ?? position) - position);

  for (let index = 1; index < ordered.length; index += 1) {
    const point = ordered[index];
    if (!point) continue;
    const distance = Math.abs(point.position - position);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

/**
 * Resolve a draggable sheet/card to a stable state using current position,
 * release velocity and the position where this gesture began.
 *
 * A high-velocity release may commit the adjacent state from the gesture start,
 * but it must not add an extra snap after the pointer has already reached the
 * next state. If the pointer itself traversed multiple states, its actual
 * nearest state remains authoritative.
 */
export function resolveSnapPoint(
  currentPosition: number,
  velocity: number,
  points: readonly SnapPoint[],
  gestureStartPosition = currentPosition
): SnapPoint {
  if (points.length === 0) {
    throw new Error('At least one snap point is required');
  }

  const ordered = [...points].sort((a, b) => a.position - b.position);
  const nearestIndex = nearestSnapIndex(currentPosition, ordered);
  const nearest = ordered[nearestIndex] ?? ordered[0]!;

  if (Math.abs(velocity) < motion.sheet.velocityCommit) return nearest;

  const direction = velocity > 0 ? 1 : -1;
  const startIndex = nearestSnapIndex(gestureStartPosition, ordered);
  const adjacentFromStart = Math.max(0, Math.min(ordered.length - 1, startIndex + direction));

  let targetIndex: number;
  if (direction > 0) {
    targetIndex = nearestIndex > startIndex ? nearestIndex : adjacentFromStart;
  } else {
    targetIndex = nearestIndex < startIndex ? nearestIndex : adjacentFromStart;
  }

  return ordered[targetIndex] ?? nearest;
}

/**
 * Resistance used only after a hard interaction boundary has been crossed.
 * The direct-manipulation range remains 1:1 with the user's pointer.
 */
export function applyRubberBand(overshootPx: number) {
  if (overshootPx <= 0) return 0;
  if (overshootPx <= motion.rubberBand.linearPx) return overshootPx;
  return motion.rubberBand.linearPx
    + (overshootPx - motion.rubberBand.linearPx) * motion.rubberBand.resistance;
}

export function clampScale(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
