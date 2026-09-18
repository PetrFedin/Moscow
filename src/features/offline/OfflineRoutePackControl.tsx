import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';

export default function OfflineRoutePackControl({ language }: { language: AppLanguage }) {
  const ru = language === 'ru';
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{ru ? 'ОФЛАЙН-МАРШРУТ' : 'OFFLINE ROUTE'}</Text>
      <Text style={styles.title}>{ru ? 'Скачивание доступно в iOS / Android' : 'Download is available on iOS / Android'}</Text>
      <Text style={styles.body}>
        {ru
          ? '3D-модели уже входят в мобильную сборку; архив 1857 скачивается в локальный пакет маршрута.'
          : '3D models are bundled with the mobile app; the 1857 archive is downloaded into the local route pack.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: '#343941', backgroundColor: '#111418', padding: 14, marginBottom: 14 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.2, fontWeight: '900' },
  title: { color: '#eee9df', fontSize: 13, fontWeight: '900', marginTop: 4 },
  body: { color: '#8f949c', fontSize: 10, lineHeight: 15, marginTop: 4 }
});
