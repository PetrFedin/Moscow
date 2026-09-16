import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { haptic } from './haptics';
import { motion } from './interactionPhysics';

const HANDLE = 52;
const PADDING = 6;
const COMMIT_RATIO = 0.72;

type Props = {
  label: string;
  committedLabel?: string;
  disabled?: boolean;
  committed?: boolean;
  onCommit: () => void;
};

export default function PortalTransitionControl({
  label,
  committedLabel = 'PORTAL READY',
  disabled = false,
  committed = false,
  onCommit
}: Props) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const maxTravel = Math.max(0, width - HANDLE - PADDING * 2);

  const commit = () => {
    void haptic('spatial-enter');
    onCommit();
  };

  const gesture = useMemo(() => Gesture.Pan()
    .enabled(!disabled && !committed && maxTravel > 0)
    .minDistance(1)
    .onBegin(() => {
      cancelAnimation(x);
      startX.value = x.value;
    })
    .onUpdate((event) => {
      x.value = Math.max(0, Math.min(maxTravel, startX.value + event.translationX));
    })
    .onEnd((event) => {
      const ratio = maxTravel > 0 ? x.value / maxTravel : 0;
      const velocityCommit = event.velocityX > 900 && ratio > 0.35;
      if (ratio >= COMMIT_RATIO || velocityCommit) {
        x.value = withSpring(maxTravel, {
          damping: motion.spring.firm.damping,
          stiffness: motion.spring.firm.stiffness,
          mass: motion.spring.firm.mass,
          overshootClamping: true
        });
        runOnJS(commit)();
        return;
      }
      x.value = withSpring(0, {
        damping: motion.spring.firm.damping,
        stiffness: motion.spring.firm.stiffness,
        mass: motion.spring.firm.mass,
        overshootClamping: true
      });
    }), [committed, disabled, maxTravel]);

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: committed ? maxTravel : x.value }]
  }));

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      style={[styles.track, disabled && styles.disabled, committed && styles.committedTrack]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Text style={[styles.label, committed && styles.committedLabel]}>{committed ? committedLabel : label}</Text>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.handle, handleStyle, committed && styles.committedHandle]}>
          <Text style={styles.arrow}>{committed ? '✓' : '→'}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8d744e',
    backgroundColor: '#211b13',
    justifyContent: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden'
  },
  disabled: { opacity: 0.38 },
  committedTrack: { borderColor: '#759982', backgroundColor: '#142019' },
  label: { color: '#d9bd87', fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' },
  committedLabel: { color: '#9bc3a5' },
  handle: {
    position: 'absolute',
    left: PADDING,
    width: HANDLE,
    height: HANDLE,
    borderRadius: 17,
    backgroundColor: '#d7bb84',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  committedHandle: { backgroundColor: '#8eb19a' },
  arrow: { color: '#17130d', fontSize: 21, fontWeight: '900' }
});
