import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Place } from '../../data/places';
import { speechLocale, tr, type AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { playNarrationGuide, stopNarrationGuide, type AudioPlaybackMode } from '../audio/audioGuide';
import { buildWalkAudioPlan } from '../audio/varvarkaAudioCatalog';
import {
  buildPlaceWalkNarration,
  distanceMeters,
  getObservationMission
} from './walkCompanionContract';

type Props = {
  place: Place;
  language: AppLanguage;
  missionDone: boolean;
  autoEnabled: boolean;
  onAutoEnabledChange: (enabled: boolean) => void;
  onMissionComplete: (missionId: string) => void;
  onAutoStopCompleted: (placeId: string) => void;
  onProximityArrive?: (placeId: string) => void;
  onAudioStart?: (placeId: string, mode: AudioPlaybackMode) => void;
  onAudioComplete?: (placeId: string, mode: AudioPlaybackMode) => void;
  onTranscriptOpen?: (placeId: string) => void;
};

const TRIGGER_RADIUS_METERS = 55;

export default function WalkCompanion({
  place,
  language,
  missionDone,
  autoEnabled,
  onAutoEnabledChange,
  onMissionComplete,
  onAutoStopCompleted,
  onProximityArrive,
  onAudioStart,
  onAudioComplete,
  onTranscriptOpen
}: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const triggeredRef = useRef(false);
  const mission = useMemo(() => getObservationMission(place, language), [language, place]);
  const fallbackNarration = useMemo(() => buildPlaceWalkNarration(place, language), [language, place]);
  const audioPlan = useMemo(
    () => buildWalkAudioPlan({
      placeId: place.id,
      locale: language,
      fallbackTranscript: fallbackNarration,
      displayTitle: place.title
    }),
    [fallbackNarration, language, place.id, place.title]
  );
  const [playbackMode, setPlaybackMode] = useState<AudioPlaybackMode>(audioPlan.mode);
  const playbackModeRef = useRef<AudioPlaybackMode>(audioPlan.mode);
  const audioStartReportedRef = useRef(false);

  useEffect(() => {
    triggeredRef.current = false;
    setDistance(null);
    setTranscriptOpen(false);
    setPlaybackMode(audioPlan.mode);
    playbackModeRef.current = audioPlan.mode;
    audioStartReportedRef.current = false;
  }, [audioPlan, place.id]);

  useEffect(() => {
    if (!autoEnabled) return;
    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (permission.status !== 'granted') {
        setPermissionDenied(true);
        onAutoEnabledChange(false);
        return;
      }
      setPermissionDenied(false);
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 4000
        },
        (position) => {
          if (!active) return;
          const nextDistance = distanceMeters(
            { latitude: position.coords.latitude, longitude: position.coords.longitude },
            { latitude: place.latitude, longitude: place.longitude }
          );
          setDistance(nextDistance);
          if (nextDistance <= TRIGGER_RADIUS_METERS && !triggeredRef.current) {
            triggeredRef.current = true;
            onProximityArrive?.(place.id);
            audioStartReportedRef.current = false;
            setSpeaking(true);
            playNarrationGuide(
              audioPlan,
              speechLocale(language),
              () => {
                if (!active) return;
                setSpeaking(false);
                onAudioComplete?.(place.id, playbackModeRef.current);
                onAutoStopCompleted(place.id);
              },
              (mode) => {
                setPlaybackMode(mode);
                playbackModeRef.current = mode;
                if (!audioStartReportedRef.current) {
                  audioStartReportedRef.current = true;
                  onAudioStart?.(place.id, mode);
                }
              },
              () => {
                if (active) setSpeaking(false);
              }
            );
          }
        }
      );
    })().catch(() => {
      if (active) {
        setPermissionDenied(true);
        onAutoEnabledChange(false);
      }
    });

    return () => {
      active = false;
      subscription?.remove();
      void stopNarrationGuide();
    };
  }, [audioPlan, autoEnabled, language, onAudioComplete, onAudioStart, onAutoEnabledChange, onAutoStopCompleted, onProximityArrive, place.id, place.latitude, place.longitude]);

  const toggleAudio = () => {
    if (speaking) {
      void stopNarrationGuide();
      setSpeaking(false);
      return;
    }
    audioStartReportedRef.current = false;
    setSpeaking(true);
    playNarrationGuide(
      audioPlan,
      speechLocale(language),
      () => {
        setSpeaking(false);
        onAudioComplete?.(place.id, playbackModeRef.current);
      },
      (mode) => {
        setPlaybackMode(mode);
        playbackModeRef.current = mode;
        if (!audioStartReportedRef.current) {
          audioStartReportedRef.current = true;
          onAudioStart?.(place.id, mode);
        }
      },
      () => setSpeaking(false)
    );
  };

  const distanceLabel = distance == null
    ? tr(language, 'Ищем следующую точку…', 'Finding the next stop…', '正在寻找下一站…')
    : distance <= TRIGGER_RADIUS_METERS
      ? tr(language, 'Вы у точки · рассказ запускается', 'You are at the stop · audio starts', '已到达本站 · 音频即将开始')
      : distance > 350
        ? tr(language, `До следующей точки ≈ ${Math.round(distance)} м · откройте карту`, `About ${Math.round(distance)} m to the next stop · open the map`, `距下一站约 ${Math.round(distance)} 米 · 打开地图`)
        : tr(language, `До точки ≈ ${Math.round(distance)} м`, `About ${Math.round(distance)} m to the stop`, `距本站约 ${Math.round(distance)} 米`);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{tr(language, 'АУДИО · СМОТРИТЕ ПО СТОРОНАМ', 'AUDIO · LOOK AROUND', '音频 · 抬头看看周围')}</Text>
          <Text style={styles.title}>{tr(language, 'Телефон можно убрать в карман', 'You can put the phone away', '可以把手机收进口袋')}</Text>
        </View>
        <PhysicalPressable
          style={[styles.audio, speaking && styles.audioActive]}
          contentStyle={styles.center}
          onPress={toggleAudio}
          accessibilityLabel={speaking ? tr(language, 'Остановить аудиогид', 'Stop audio guide', '停止音频导览') : tr(language, 'Слушать остановку', 'Listen to stop', '收听本站')}
        >
          <Text style={[styles.audioText, speaking && styles.audioTextActive]}>{speaking ? '■' : '▶'}</Text>
        </PhysicalPressable>
      </View>

      <View style={[styles.audioAuthority, playbackMode === 'recorded' && styles.audioAuthorityReady]}>
        <Text style={[styles.audioAuthorityText, playbackMode === 'recorded' && styles.audioAuthorityTextReady]}>
          {playbackMode === 'recorded'
            ? 'HUMAN MASTER · VERIFIED'
            : tr(language, 'TTS FALLBACK · ЗАПИСЬ ГОТОВИТСЯ', 'TTS FALLBACK · RECORDING PENDING', 'TTS备用 · 真人录音准备中')}
        </Text>
      </View>

      <PhysicalPressable
        style={styles.transcriptButton}
        contentStyle={styles.transcriptButtonContent}
        hapticEvent="none"
        onPress={() => setTranscriptOpen((value) => {
          const next = !value;
          if (next) onTranscriptOpen?.(place.id);
          return next;
        })}
        accessibilityLabel={transcriptOpen
          ? tr(language, 'Скрыть текст аудиогида', 'Hide audio transcript', '隐藏音频文字')
          : tr(language, 'Показать текст аудиогида', 'Show audio transcript', '显示音频文字')}
      >
        <Text style={styles.transcriptButtonText}>
          {transcriptOpen
            ? tr(language, 'Скрыть текст', 'Hide transcript', '隐藏文字')
            : tr(language, 'Текст аудио', 'Audio transcript', '音频文字')}
        </Text>
      </PhysicalPressable>
      {transcriptOpen && (
        <View style={styles.transcript}>
          <Text style={styles.transcriptText}>{audioPlan.transcript}</Text>
        </View>
      )}

      <PhysicalPressable
        style={[styles.auto, autoEnabled && styles.autoActive]}
        contentStyle={styles.autoContent}
        onPress={() => onAutoEnabledChange(!autoEnabled)}
        accessibilityLabel={autoEnabled ? tr(language, 'Выключить автогид', 'Disable automatic guide', '关闭自动导览') : tr(language, 'Включить автогид по геопозиции', 'Enable location audio guide', '开启定位自动导览')}
      >
        <View style={styles.autoCopy}>
          <Text style={[styles.autoTitle, autoEnabled && styles.autoTitleActive]}>
            {autoEnabled ? tr(language, '● Автогид включён', '● Auto guide on', '● 自动导览已开启') : tr(language, 'Автогид по геопозиции', 'Location auto guide', '定位自动导览')}
          </Text>
          <Text style={styles.autoBody}>
            {autoEnabled ? distanceLabel : tr(language, 'Рассказ запустится рядом с текущей остановкой.', 'Audio will start when you reach the current stop.', '到达当前站点附近后，音频会自动开始。')}
          </Text>
        </View>
      </PhysicalPressable>

      {permissionDenied && (
        <Text style={styles.warning}>
          {tr(language, 'Геопозиция недоступна — используйте ручную кнопку аудио.', 'Location is unavailable — use the manual audio button.', '无法获取定位，请使用手动播放按钮。')}
        </Text>
      )}

      <View style={[styles.mission, missionDone && styles.missionDone]}>
        <Text style={styles.missionKicker}>{tr(language, 'МИССИЯ НАБЛЮДЕНИЯ', 'LOOKING MISSION', '观察任务')}</Text>
        <Text style={styles.missionText}>{mission.prompt}</Text>
        <PhysicalPressable
          style={[styles.missionButton, missionDone && styles.missionButtonDone]}
          contentStyle={styles.center}
          disabled={missionDone}
          onPress={() => onMissionComplete(mission.id)}
          accessibilityLabel={missionDone ? tr(language, 'Наблюдение выполнено', 'Mission completed', '观察任务已完成') : tr(language, 'Я нашёл', 'I found it', '我找到了')}
        >
          <Text style={[styles.missionButtonText, missionDone && styles.missionButtonTextDone]}>
            {missionDone ? tr(language, '✓ Найдено', '✓ Found', '✓ 已找到') : tr(language, 'Я нашёл', 'I found it', '我找到了')}
          </Text>
        </PhysicalPressable>
      </View>
      <Text style={styles.privacy}>
        {tr(language, 'Геопозиция используется только во время активной прогулки и не сохраняется.', 'Location is used only during the active walk and is not stored.', '定位仅在进行中的路线中使用，不会被保存。')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#353b42', backgroundColor: '#101318', padding: 14, marginTop: 12 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  copy: { flex: 1, minWidth: 0 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  title: { color: '#f1ece3', fontSize: 14, fontWeight: '900', marginTop: 4 },
  audio: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#6f6047', backgroundColor: '#211b13' },
  audioActive: { backgroundColor: '#d7bb84' },
  audioText: { color: '#e7c98f', fontSize: 14, fontWeight: '900' },
  audioTextActive: { color: '#17130d' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  audioAuthority: { alignSelf: 'flex-start', borderRadius: 9, borderWidth: 1, borderColor: '#6e5634', backgroundColor: '#20190f', paddingHorizontal: 8, paddingVertical: 5, marginTop: 9 },
  audioAuthorityReady: { borderColor: '#4d7457', backgroundColor: '#101b14' },
  audioAuthorityText: { color: '#c7a971', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.7 },
  audioAuthorityTextReady: { color: '#acd2b4' },
  transcriptButton: { minHeight: 36, borderRadius: 11, borderWidth: 1, borderColor: '#3e444b', marginTop: 8 },
  transcriptButtonContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  transcriptButtonText: { color: '#b7bbc1', fontSize: 9, fontWeight: '900' },
  transcript: { borderRadius: 12, backgroundColor: '#171a1f', padding: 10, marginTop: 7 },
  transcriptText: { color: '#aeb3ba', fontSize: 10, lineHeight: 15 },
  auto: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#3e444b', marginTop: 10 },
  autoActive: { borderColor: '#597a61', backgroundColor: '#111b14' },
  autoContent: { paddingHorizontal: 12, paddingVertical: 10 },
  autoCopy: { width: '100%' },
  autoTitle: { color: '#c5c8cc', fontSize: 10, fontWeight: '900' },
  autoTitleActive: { color: '#abd1b2' },
  autoBody: { color: '#858b93', fontSize: 9, lineHeight: 13, marginTop: 3 },
  warning: { color: '#c58d81', fontSize: 9, lineHeight: 13, marginTop: 7 },
  mission: { borderRadius: 15, borderWidth: 1, borderColor: '#4b4436', backgroundColor: '#17140f', padding: 12, marginTop: 10 },
  missionDone: { borderColor: '#486752', backgroundColor: '#111b14' },
  missionKicker: { color: '#c1a46f', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  missionText: { color: '#d4d0c7', fontSize: 11, lineHeight: 16, marginTop: 5 },
  missionButton: { minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: '#796744', marginTop: 9 },
  missionButtonDone: { borderColor: '#4f7658' },
  missionButtonText: { color: '#e5c78d', fontSize: 9, fontWeight: '900' },
  missionButtonTextDone: { color: '#abd1b2' },
  privacy: { color: '#686e76', fontSize: 8, lineHeight: 12, marginTop: 8 }
});
