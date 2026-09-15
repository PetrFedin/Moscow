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
  ...pressableProps
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? motion.opacity.disabled : 1
  }));

  const handlePressIn: NonNullable<PressableProps['onPressIn']> = (event) => {
    cancelAnimation(scale);
    scale.value = withTiming(strong ? motion.scale.strongPress : motion.scale.press, {
      duration: motion.duration.instant
    });
    if (hapticEvent !== 'none') void haptic(hapticEvent);
    onPressIn?.(event);
  };

  const handlePressOut: NonNullable<PressableProps['onPressOut']> = (event) => {
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: motion.duration.fast });
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...pressableProps}
        disabled={disabled}
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
