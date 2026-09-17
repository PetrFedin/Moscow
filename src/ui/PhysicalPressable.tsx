import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { haptic, type HapticEvent } from './haptics';
import { motion } from './interactionPhysics';
import useReducedMotion from './useReducedMotion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** Layout and positioning of the animated physical surface. */
  style?: StyleProp<ViewStyle>;
  /** Layout of the interactive content inside that surface. */
  contentStyle?: StyleProp<ViewStyle>;
  strong?: boolean;
  hapticEvent?: HapticEvent | 'none';
};

export default function PhysicalPressable({
  children,
  style,
  contentStyle,
  strong = false,
  disabled = false,
  hapticEvent = 'button',
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  accessibilityState,
  ...pressableProps
}: Props) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const feedbackOpacity = useSharedValue(1);
  const isDisabled = disabled === true;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? motion.opacity.disabled : feedbackOpacity.value
  }));

  const handlePressIn: NonNullable<PressableProps['onPressIn']> = (event) => {
    cancelAnimation(scale);
    cancelAnimation(feedbackOpacity);

    if (reducedMotion) {
      scale.value = 1;
      feedbackOpacity.value = withTiming(0.86, { duration: motion.duration.instant });
    } else {
      scale.value = withTiming(strong ? motion.scale.strongPress : motion.scale.press, {
        duration: motion.duration.instant
      });
      feedbackOpacity.value = 1;
    }

    if (hapticEvent !== 'none') void haptic(hapticEvent);
    onPressIn?.(event);
  };

  const handlePressOut: NonNullable<PressableProps['onPressOut']> = (event) => {
    cancelAnimation(scale);
    cancelAnimation(feedbackOpacity);
    scale.value = withTiming(1, { duration: reducedMotion ? 0 : motion.duration.fast });
    feedbackOpacity.value = withTiming(1, { duration: motion.duration.fast });
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...pressableProps}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.hitTarget, contentStyle]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hitTarget: {
    flex: 1,
    minWidth: motion.touch.minimumTarget,
    minHeight: motion.touch.minimumTarget
  }
});
