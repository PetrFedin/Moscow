import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Place } from '../../data/places';
import { speechLocale, tr, type AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { playNarrationGuide, stopNarrationGuide, type AudioPlaybackMode } from '../audio/audioGuide';
import { buildWalkAudioPlan } from '../audio/varvarkaAudioCatalog';
import { buildPlaceWalkNarration, getObservationMission } from './walkCompanionContract';

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

export default function WalkCompanion({
  place,
  language,
  missionDone,
  autoEnabled,
  onAutoEnabledChange,
  onMissionComplete,
  onAudioStart,
  onAudioComplete,
  onTranscriptOpen
}: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
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
    setPlaybackMode(audioPlan.mode);
    playbackModeRef.current = audioPlan.mode;
    audioStartReportedRef.current = false;
    setTranscriptOpen(false);
  }, [audioPlan]);

  useEffect(() => () => { void stopNarrationGuide(); }, []);

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

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{tr(language, 'АУДИО · СМОТРИТЕ ПО СТОРОНАМ', 'AUDIO · LOOK AROUND', '音频 · 抬头看看周围')}</Text>
          <Text style={styles.title}>{tr(language, 'Уберите телефон и слушайте', 'Put the phone away and listen', '收起手机，边走边听')}</Text>
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

      <View style={styles.autoNotice}>
        <Text style={styles.autoText}>
          {tr(language, 'Автозапуск по геопозиции работает в мобильной iOS/Android сборке.', 'Location-triggered playback is available in the iOS/Android app.', '基于定位的自动播放可在 iOS/Android 应用中使用。')}
        </Text>
      </View>

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
  autoNotice: { borderRadius: 12, backgroundColor: '#171a1f', padding: 9, marginTop: 10 },
  autoText: { color: '#858b93', fontSize: 9, lineHeight: 13 },
  mission: { borderRadius: 15, borderWidth: 1, borderColor: '#4b4436', backgroundColor: '#17140f', padding: 12, marginTop: 10 },
  missionDone: { borderColor: '#486752', backgroundColor: '#111b14' },
  missionKicker: { color: '#c1a46f', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  missionText: { color: '#d4d0c7', fontSize: 11, lineHeight: 16, marginTop: 5 },
  missionButton: { minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: '#796744', marginTop: 9 },
  missionButtonDone: { borderColor: '#4f7658' },
  missionButtonText: { color: '#e5c78d', fontSize: 9, fontWeight: '900' },
  missionButtonTextDone: { color: '#abd1b2' }
});
