import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  onClose: () => void;
  onBackToArchive: () => void;
  onOpenSpatial: () => void;
};

export default function HistoricalModelViewerFallback({ onClose, onBackToArchive, onOpenSpatial }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.kicker}>3D MODEL · ROMANOV</Text>
      <Text style={styles.title}>Одна историческая модель — несколько режимов</Text>
      <Text style={styles.body}>
        Нативная сборка использует ту же GLB-модель для интерактивного 3D-просмотра, AR на телефоне и VR на Quest. Веб-версия использует отдельный безопасный viewer только для предварительного просмотра.
      </Text>
      <View style={styles.flow}>
        {['Архив', '3D', 'AR', 'VR'].map((item, index) => (
          <React.Fragment key={item}>
            <View style={[styles.step, index === 1 && styles.stepActive]}><Text style={[styles.stepText, index === 1 && styles.stepTextActive]}>{item}</Text></View>
            {index < 3 && <Text style={styles.arrow}>→</Text>}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={onBackToArchive}><Text style={styles.secondaryText}>← Архив</Text></Pressable>
        <Pressable style={styles.primary} onPress={onOpenSpatial}><Text style={styles.primaryText}>Открыть spatial mode</Text></Pressable>
      </View>
      <Pressable onPress={onClose}><Text style={styles.close}>Закрыть</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#07090c', alignItems: 'center', justifyContent: 'center', padding: 28 },
  kicker: { color: '#b99b69', fontSize: 10, letterSpacing: 1.5, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 27, lineHeight: 33, fontWeight: '900', textAlign: 'center', marginTop: 10, maxWidth: 560 },
  body: { color: '#9ea3ab', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 620, marginTop: 10 },
  flow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  step: { minWidth: 64, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: '#3c4148', alignItems: 'center' },
  stepActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  stepText: { color: '#c4c8cd', fontSize: 11, fontWeight: '900' },
  stepTextActive: { color: '#17130d' },
  arrow: { color: '#686d75', marginHorizontal: 7 },
  actions: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 520, marginTop: 28 },
  secondary: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#454a51', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#d0bb91', fontWeight: '900' },
  primary: { flex: 1.4, minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#17130d', fontWeight: '900' },
  close: { color: '#777d85', marginTop: 18, fontSize: 11 }
});
