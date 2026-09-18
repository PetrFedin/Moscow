import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Place } from '../../data/places';
import type { AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { playTextGuide, stopTextGuide } from '../audio/audioGuide';
import { buildPlaceWalkNarration, getObservationMission } from './walkCompanionContract';

type Props = {
  place: Place;
  language: AppLanguage;
  missionDone: boolean;
  autoEnabled: boolean;
  onAutoEnabledChange: (enabled: boolean) => void;
  onMissionComplete: (missionId: string) => void;
  onAutoStopCompleted: (placeId: string) => void;
};

export default function WalkCompanion({
  place,
  language,
  missionDone,
  autoEnabled,
  onAutoEnabledChange,
  onMissionComplete
}: Props) {
  const [speaking, setSpeaking] = useState(false);
  const mission = useMemo(() => getObservationMission(place, language), [language, place]);
  const narration = useMemo(() => buildPlaceWalkNarration(place, language), [language, place]);

  useEffect(() => () => { void stopTextGuide().catch(() => undefined); }, []);

  const toggleAudio = () => {
    if (speaking) {
      void stopTextGuide().catch(() => undefined);
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    playTextGuide(narration, language === 'ru' ? 'ru-RU' : 'en-US', () => setSpeaking(false));
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{language === 'ru' ? 'АУДИО · СМОТРИТЕ ПО СТОРОНАМ' : 'AUDIO · LOOK AROUND'}</Text>
          <Text style={styles.title}>{language === 'ru' ? 'Уберите телефон и слушайте' : 'Put the phone away and listen'}</Text>
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

      <View style={styles.autoNotice}>
        <Text style={styles.autoText}>
          {language === 'ru'
            ? 'Автозапуск по геопозиции работает в мобильной iOS/Android сборке.'
            : 'Location-triggered playback is available in the iOS/Android app.'}
        </Text>
      </View>

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
