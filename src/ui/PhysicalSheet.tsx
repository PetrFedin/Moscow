import React, { type ReactNode, useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { motion, type StableSheetState } from './interactionPhysics';

type SnapPositions = Record<StableSheetState, number>;

type Props = {
  children: ReactNode;
  snapPositions: SnapPositions;
  initialState?: StableSheetState;
  onStateChange?: (state: StableSheetState) => void;
  style?: StyleProp<ViewStyle>;
};

const stateFromIndex = (index: number): StableSheetState => {
  'worklet';
  if (index <= 0) return 'collapsed';
  if (index === 1) return 'preview';
  return 'expanded';
};

export default function PhysicalSheet({
  children,
  snapPositions,
  initialState = 'preview',
  onStateChange,
  style
}: Props) {
  const ordered = [
    snapPositions.collapsed,
    snapPositions.preview,
    snapPositions.expanded
  ].sort((a, b) => a - b);

  const translateY = useSharedValue(snapPositions[initialState]);
  const gestureStartY = useSharedValue(translateY.value);

  useEffect(() => {
    translateY.value = snapPositions[initialState];
  }, [initialState, snapPositions.collapsed, snapPositions.expanded, snapPositions.preview, translateY]);

  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(() => {
      cancelAnimation(translateY);
      gestureStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const raw = gestureStartY.value + event.translationY;
      const min = ordered[0] ?? 0;
      const max = ordered[2] ?? min;

      if (raw < min) {
        const overshoot = min - raw;
        const resisted = overshoot <= motion.rubberBand.linearPx
          ? overshoot
          : motion.rubberBand.linearPx
            + (overshoot - motion.rubberBand.linearPx) * motion.rubberBand.resistance;
        translateY.value = min - resisted;
        return;
      }

      if (raw > max) {
        const overshoot = raw - max;
        const resisted = overshoot <= motion.rubberBand.linearPx
          ? overshoot
          : motion.rubberBand.linearPx
            + (overshoot - motion.rubberBand.linearPx) * motion.rubberBand.resistance;
        translateY.value = max + resisted;
        return;
      }

      // 1:1 direct manipulation while the finger is within the valid range.
      translateY.value = raw;
    })
    .onEnd((event) => {
      const p0 = ordered[0] ?? 0;
      const p1 = ordered[1] ?? p0;
      const p2 = ordered[2] ?? p1;
      const current = translateY.value;

      let nearestIndex = 0;
      let nearestDistance = Math.abs(current - p0);
      const d1 = Math.abs(current - p1);
      const d2 = Math.abs(current - p2);
      if (d1 < nearestDistance) {
        nearestIndex = 1;
        nearestDistance = d1;
      }
      if (d2 < nearestDistance) nearestIndex = 2;

      if (Math.abs(event.velocityY) >= motion.sheet.velocityCommit) {
        const direction = event.velocityY > 0 ? 1 : -1;
        nearestIndex = Math.max(0, Math.min(2, nearestIndex + direction));
      }

      const target = nearestIndex === 0 ? p0 : nearestIndex === 1 ? p1 : p2;
      translateY.value = withSpring(target, {
        damping: motion.spring.firm.damping,
        stiffness: motion.spring.firm.stiffness,
        mass: motion.spring.firm.mass,
        overshootClamping: true
      });

      if (onStateChange) runOnJS(onStateChange)(stateFromIndex(nearestIndex));
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.surface, animatedStyle, style]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    position: 'absolute',
    left: 0,
    right: 0
  }
});
