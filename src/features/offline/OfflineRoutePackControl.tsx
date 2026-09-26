import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tr, type AppLanguage } from '../../i18n';

export default function OfflineRoutePackControl({ language }: { language: AppLanguage }) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{tr(language, 'ОФЛАЙН-МАРШРУТ', 'OFFLINE ROUTE', '离线路线')}</Text>
      <Text style={styles.title}>{tr(language, 'Скачивание доступно в iOS / Android', 'Download is available on iOS / Android', '可在 iOS / Android 下载')}</Text>
      <Text style={styles.body}>
        {tr(language, '3D-модели уже входят в мобильную сборку; архив 1857 скачивается в локальный пакет маршрута.', '3D models are bundled with the mobile app; the 1857 archive is downloaded into the local route pack.', '3D模型已包含在移动端应用中；1857年的档案资料会下载到本地路线包。')}
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
