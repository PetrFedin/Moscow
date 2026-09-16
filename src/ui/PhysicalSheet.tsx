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

type SnapPoint = { state: StableSheetState; y: number };

export default function PhysicalSheet({
  children,
  snapPositions,
  initialState = 'preview',
  onStateChange,
  style
}: Props) {
  const points: SnapPoint[] = [
    { state: 'collapsed', y: snapPositions.collapsed },
    { state: 'preview', y: snapPositions.preview },
    { state: 'expanded', y: snapPositions.expanded }
  ];
  const ordered = points.sort((a, b) => a.y - b.y);

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
      const min = ordered[0]?.y ?? 0;
      const max = ordered[2]?.y ?? min;

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

      translateY.value = raw;
    })
    .onEnd((event) => {
      const current = translateY.value;
      let nearestIndex = 0;
      let nearestDistance = Math.abs(current - (ordered[0]?.y ?? current));

      for (let index = 1; index < ordered.length; index += 1) {
        const point = ordered[index];
        if (!point) continue;
        const distance = Math.abs(current - point.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      if (Math.abs(event.velocityY) >= motion.sheet.velocityCommit) {
        const direction = event.velocityY > 0 ? 1 : -1;
        nearestIndex = Math.max(0, Math.min(ordered.length - 1, nearestIndex + direction));
      }

      const target = ordered[nearestIndex] ?? ordered[0];
      if (!target) return;

      translateY.value = withSpring(target.y, {
        damping: motion.spring.firm.damping,
        stiffness: motion.spring.firm.stiffness,
        mass: motion.spring.firm.mass,
        overshootClamping: true
      });

      if (onStateChange) runOnJS(onStateChange)(target.state);
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
