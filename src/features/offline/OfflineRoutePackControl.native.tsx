import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { pilotRoute } from '../../data/places';
import PhysicalPressable from '../../ui/PhysicalPressable';
import {
  downloadRoutePack,
  getDownloadedRoutePack,
  removeRoutePack
} from './routePack';
import {
  createVarvarkaRoutePackManifest,
  VARVARKA_OFFLINE_PACK_VERSION
} from './varvarkaRoutePack';

type PackState = 'checking' | 'missing' | 'ready' | 'stale' | 'downloading' | 'error';

export default function OfflineRoutePackControl({ language }: { language: AppLanguage }) {
  const [state, setState] = useState<PackState>('checking');
  const [error, setError] = useState<string | null>(null);
  const ru = language === 'ru';

  const refresh = useCallback(async () => {
    setState('checking');
    setError(null);
    try {
      const pack = await getDownloadedRoutePack(pilotRoute.id, language);
      if (!pack) {
        setState('missing');
      } else {
        setState(pack.version === VARVARKA_OFFLINE_PACK_VERSION ? 'ready' : 'stale');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setState('error');
    }
  }, [language]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const download = async () => {
    setState('downloading');
    setError(null);
    try {
      const manifest = createVarvarkaRoutePackManifest(language);
      await downloadRoutePack(manifest);
      setState('ready');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setState('error');
    }
  };

  const remove = async () => {
    setState('checking');
    setError(null);
    try {
      await removeRoutePack(pilotRoute.id, language);
      setState('missing');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setState('error');
    }
  };

  const title = state === 'ready'
    ? (ru ? 'Офлайн-пакет готов' : 'Offline pack ready')
    : state === 'stale'
      ? (ru ? 'Офлайн-пакет нужно обновить' : 'Offline pack needs an update')
      : (ru ? 'Скачать Варварку офлайн' : 'Download Varvarka offline');

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{ru ? 'ОФЛАЙН-МАРШРУТ' : 'OFFLINE ROUTE'}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>
            {ru
              ? 'GLB и исторические данные уже bundled; архив 1857 сохраняется локально для Time Lens.'
              : 'GLB models and historical data are bundled; the 1857 archive is stored locally for Time Lens.'}
          </Text>
        </View>
        {(state === 'checking' || state === 'downloading') && <ActivityIndicator color="#d7bb84" />}
      </View>

      {state === 'ready' ? (
        <View style={styles.actions}>
          <View style={styles.readyBadge}><Text style={styles.readyText}>{ru ? 'ГОТОВО БЕЗ СЕТИ' : 'READY OFFLINE'}</Text></View>
          <PhysicalPressable style={styles.secondary} contentStyle={styles.center} onPress={remove}>
            <Text style={styles.secondaryText}>{ru ? 'Удалить' : 'Remove'}</Text>
          </PhysicalPressable>
        </View>
      ) : (
        <PhysicalPressable
          style={[styles.primary, state === 'downloading' && styles.disabled]}
          contentStyle={styles.center}
          disabled={state === 'downloading' || state === 'checking'}
          strong
          onPress={download}
        >
          <Text style={styles.primaryText}>
            {state === 'downloading'
              ? (ru ? 'Скачиваем…' : 'Downloading…')
              : state === 'stale'
                ? (ru ? 'Обновить пакет' : 'Update pack')
                : (ru ? 'Скачать офлайн' : 'Download offline')}
          </Text>
        </PhysicalPressable>
      )}

      {error && <Text style={styles.error}>{ru ? 'Не удалось подготовить пакет: ' : 'Could not prepare pack: '}{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: '#343941', backgroundColor: '#111418', padding: 14, marginBottom: 14 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  copy: { flex: 1, minWidth: 0 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.2, fontWeight: '900' },
  title: { color: '#eee9df', fontSize: 14, fontWeight: '900', marginTop: 4 },
  body: { color: '#8f949c', fontSize: 10, lineHeight: 15, marginTop: 4 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  primary: { minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84', marginTop: 10 },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  readyBadge: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: '#17251b', borderWidth: 1, borderColor: '#4f7658', alignItems: 'center', justifyContent: 'center' },
  readyText: { color: '#abd1b2', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  secondary: { width: 86, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: '#444a51' },
  secondaryText: { color: '#c9b995', fontSize: 9, fontWeight: '900' },
  error: { color: '#c28d82', fontSize: 9, lineHeight: 13, marginTop: 8 }
});
