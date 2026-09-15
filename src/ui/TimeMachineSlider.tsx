import Slider from '@react-native-community/slider';
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

  const handleValueChange = (next: number) => {
    const semanticStep = Math.round(next);
    if (semanticStep !== lastSemanticStep.current) {
      lastSemanticStep.current = semanticStep;
      void haptic('epoch-snap');
    }
    onValueChange(next);
  };

  return (
    <View style={styles.root}>
      <Slider
        accessibilityLabel={accessibilityLabel}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor="#d7bb84"
        maximumTrackTintColor="#43464d"
        thumbTintColor="#f0d39b"
      />
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
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  label: { color: '#72767e', fontSize: 10 }
});
