import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Place } from '../../data/places';
import type { AppLanguage } from '../../i18n';
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
};

const TRIGGER_RADIUS_METERS = 55;

export default function WalkCompanion({
  place,
  language,
  missionDone,
  autoEnabled,
  onAutoEnabledChange,
  onMissionComplete,
  onAutoStopCompleted
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
      fallbackTranscript: fallbackNarration
    }),
    [fallbackNarration, language, place.id]
  );
  const [playbackMode, setPlaybackMode] = useState<AudioPlaybackMode>(audioPlan.mode);

  useEffect(() => {
    triggeredRef.current = false;
    setDistance(null);
    setTranscriptOpen(false);
    setPlaybackMode(audioPlan.mode);
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
            setSpeaking(true);
            playNarrationGuide(
              audioPlan,
              language === 'ru' ? 'ru-RU' : 'en-US',
              () => {
                if (!active) return;
                setSpeaking(false);
                onAutoStopCompleted(place.id);
              },
              setPlaybackMode
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
  }, [audioPlan, autoEnabled, language, onAutoEnabledChange, onAutoStopCompleted, place.id, place.latitude, place.longitude]);

  const toggleAudio = () => {
    if (speaking) {
      void stopNarrationGuide();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    playNarrationGuide(
      audioPlan,
      language === 'ru' ? 'ru-RU' : 'en-US',
      () => setSpeaking(false),
      setPlaybackMode
    );
  };

  const distanceLabel = distance == null
    ? (language === 'ru' ? 'Ищем следующую точку…' : 'Finding the next stop…')
    : distance <= TRIGGER_RADIUS_METERS
      ? (language === 'ru' ? 'Вы у точки · рассказ запускается' : 'You are at the stop · audio starts')
      : distance > 350
        ? (language === 'ru' ? `До следующей точки ≈ ${Math.round(distance)} м · откройте карту` : `About ${Math.round(distance)} m to the next stop · open the map`)
        : (language === 'ru' ? `До точки ≈ ${Math.round(distance)} м` : `About ${Math.round(distance)} m to the stop`);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{language === 'ru' ? 'АУДИО · СМОТРИТЕ ПО СТОРОНАМ' : 'AUDIO · LOOK AROUND'}</Text>
          <Text style={styles.title}>{language === 'ru' ? 'Телефон можно убрать в карман' : 'You can put the phone away'}</Text>
        </View>
        <PhysicalPressable
          style={[styles.audio, speaking && styles.audioActive]}
          contentStyle={styles.center}
          onPress={toggleAudio}
          accessibilityLabel={speaking ? (language === 'ru' ? 'Остановить аудиогид' : 'Stop audio guide') : (language === 'ru' ? 'Слушать остановку' : 'Listen to stop')}
        >
          <Text style={[styles.audioText, speaking && styles.audioTextActive]}>{speaking ? '■' : '▶'}</Text>
        </PhysicalPressable>
      </View>

      <View style={[styles.audioAuthority, playbackMode === 'recorded' && styles.audioAuthorityReady]}>
        <Text style={[styles.audioAuthorityText, playbackMode === 'recorded' && styles.audioAuthorityTextReady]}>
          {playbackMode === 'recorded'
            ? 'HUMAN MASTER · VERIFIED'
            : (language === 'ru' ? 'TTS FALLBACK · ЗАПИСЬ ГОТОВИТСЯ' : 'TTS FALLBACK · RECORDING PENDING')}
        </Text>
      </View>

      <PhysicalPressable
        style={styles.transcriptButton}
        contentStyle={styles.transcriptButtonContent}
        hapticEvent="none"
        onPress={() => setTranscriptOpen((value) => !value)}
        accessibilityLabel={transcriptOpen
          ? (language === 'ru' ? 'Скрыть текст аудиогида' : 'Hide audio transcript')
          : (language === 'ru' ? 'Показать текст аудиогида' : 'Show audio transcript')}
      >
        <Text style={styles.transcriptButtonText}>
          {transcriptOpen
            ? (language === 'ru' ? 'Скрыть текст' : 'Hide transcript')
            : (language === 'ru' ? 'Текст аудио' : 'Audio transcript')}
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
        accessibilityLabel={autoEnabled ? (language === 'ru' ? 'Выключить автогид' : 'Disable automatic guide') : (language === 'ru' ? 'Включить автогид по геопозиции' : 'Enable location audio guide')}
      >
        <View style={styles.autoCopy}>
          <Text style={[styles.autoTitle, autoEnabled && styles.autoTitleActive]}>
            {autoEnabled ? (language === 'ru' ? '● Автогид включён' : '● Auto guide on') : (language === 'ru' ? 'Автогид по геопозиции' : 'Location auto guide')}
          </Text>
          <Text style={styles.autoBody}>
            {autoEnabled ? distanceLabel : (language === 'ru' ? 'Рассказ запустится рядом с текущей остановкой.' : 'Audio will start when you reach the current stop.')}
          </Text>
        </View>
      </PhysicalPressable>

      {permissionDenied && (
        <Text style={styles.warning}>
          {language === 'ru' ? 'Геопозиция недоступна — используйте ручную кнопку аудио.' : 'Location is unavailable — use the manual audio button.'}
        </Text>
      )}

      <View style={[styles.mission, missionDone && styles.missionDone]}>
        <Text style={styles.missionKicker}>{language === 'ru' ? 'МИССИЯ НАБЛЮДЕНИЯ' : 'LOOKING MISSION'}</Text>
        <Text style={styles.missionText}>{mission.prompt}</Text>
        <PhysicalPressable
          style={[styles.missionButton, missionDone && styles.missionButtonDone]}
          contentStyle={styles.center}
          disabled={missionDone}
          onPress={() => onMissionComplete(mission.id)}
          accessibilityLabel={missionDone ? (language === 'ru' ? 'Наблюдение выполнено' : 'Mission completed') : (language === 'ru' ? 'Я нашёл' : 'I found it')}
        >
          <Text style={[styles.missionButtonText, missionDone && styles.missionButtonTextDone]}>
            {missionDone ? (language === 'ru' ? '✓ Найдено' : '✓ Found') : (language === 'ru' ? 'Я нашёл' : 'I found it')}
          </Text>
        </PhysicalPressable>
      </View>
      <Text style={styles.privacy}>
        {language === 'ru' ? 'Геопозиция используется только во время активной прогулки и не сохраняется.' : 'Location is used only during the active walk and is not stored.'}
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
