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
import {
  motion,
  resolveSnapPoint,
  type SnapPoint,
  type StableSheetState
} from './interactionPhysics';

type SnapPositions = Record<StableSheetState, number>;

type Props = {
  children: ReactNode;
  snapPositions: SnapPositions;
  initialState?: StableSheetState;
  onStateChange?: (state: StableSheetState) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function PhysicalSheet({
  children,
  snapPositions,
  initialState = 'preview',
  onStateChange,
  style,
  testID
}: Props) {
  const points: SnapPoint[] = [
    { state: 'collapsed', position: snapPositions.collapsed },
    { state: 'preview', position: snapPositions.preview },
    { state: 'expanded', position: snapPositions.expanded }
  ];
  const ordered = [...points].sort((a, b) => a.position - b.position);

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
      const min = ordered[0]?.position ?? 0;
      const max = ordered[2]?.position ?? min;

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
      const target = resolveSnapPoint(
        translateY.value,
        event.velocityY,
        points,
        gestureStartY.value
      );

      translateY.value = withSpring(target.position, {
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
      <Animated.View testID={testID} style={[styles.surface, animatedStyle, style]}>
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
