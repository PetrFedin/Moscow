import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { haptic } from './haptics';

type Props = {
  value: number;
  minimumValue?: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  startLabel?: string;
  endLabel?: string;
  accessibilityLabel?: string;
};

/**
 * Browser-specific Time Machine control.
 *
 * @react-native-community/slider@5.2.0 renders a responder-driven View on web,
 * not a semantic HTML range input. For the public browser preview we need the
 * same direct manipulation plus native keyboard/accessibility semantics, so the
 * web surface intentionally uses a real range control while iOS/Android keep
 * the native community slider implementation from TimeMachineSlider.tsx.
 */
export default function TimeMachineSlider({
  value,
  minimumValue = 0,
  maximumValue,
  step = 1,
  onValueChange,
  startLabel,
  endLabel,
  accessibilityLabel = 'Шкала времени'
}: Props) {
  const lastSemanticStep = useRef(Math.round(value));

  const commitValue = (next: number) => {
    const semanticStep = Math.round(next);
    if (semanticStep !== lastSemanticStep.current) {
      lastSemanticStep.current = semanticStep;
      void haptic('epoch-snap');
    }
    onValueChange(next);
  };

  const range = React.createElement('input', {
    type: 'range',
    min: minimumValue,
    max: maximumValue,
    step,
    value,
    'aria-label': accessibilityLabel,
    'aria-valuemin': minimumValue,
    'aria-valuemax': maximumValue,
    'aria-valuenow': value,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => commitValue(Number(event.currentTarget.value)),
    onInput: (event: React.FormEvent<HTMLInputElement>) => commitValue(Number(event.currentTarget.value)),
    style: {
      width: '100%',
      height: 44,
      margin: 0,
      padding: 0,
      cursor: 'pointer',
      accentColor: '#d7bb84',
      background: 'transparent'
    }
  });

  return (
    <View style={styles.root}>
      <View style={styles.control}>{range}</View>
      {(startLabel || endLabel) && (
        <View style={styles.labels}>
          <Text style={styles.label}>{startLabel ?? ''}</Text>
          <Text style={styles.label}>{endLabel ?? ''}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  control: { minHeight: 44, justifyContent: 'center' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  label: { color: '#72767e', fontSize: 10 }
});
