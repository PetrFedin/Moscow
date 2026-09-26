import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import type { WalkAudioPlan } from './varvarkaAudioCatalog';

export type AudioGuideLocale = 'ru-RU' | 'en-US' | 'zh-CN';
export type AudioPlaybackMode = WalkAudioPlan['mode'];

let recordedPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let recordedSubscription: { remove: () => void } | null = null;
let playbackEpoch = 0;

function cleanupRecordedPlayer() {
  recordedSubscription?.remove();
  recordedSubscription = null;
  if (recordedPlayer) {
    try {
      recordedPlayer.pause();
      recordedPlayer.setActiveForLockScreen(false);
      recordedPlayer.remove();
    } catch {
      // Native media teardown must never block the text fallback or UI cleanup.
    }
    recordedPlayer = null;
  }
}

export function playTextGuide(
  text: string,
  locale: AudioGuideLocale = 'ru-RU',
  onFinished?: () => void
) {
  Speech.stop().catch(() => undefined);
  Speech.speak(text, {
    language: locale,
    rate: 0.94,
    pitch: 1,
    volume: 1,
    onDone: onFinished,
    onStopped: onFinished,
    onError: onFinished
  });
}

function speakNarrationFallback(
  text: string,
  locale: AudioGuideLocale,
  epoch: number,
  onFinished?: () => void,
  onInterrupted?: () => void
) {
  if (epoch !== playbackEpoch) return;
  Speech.speak(text, {
    language: locale,
    rate: 0.94,
    pitch: 1,
    volume: 1,
    onDone: () => {
      if (epoch === playbackEpoch) onFinished?.();
    },
    // A deliberate stop/pause is not a completed tourist stop.
    onStopped: () => undefined,
    onError: () => {
      if (epoch === playbackEpoch) onInterrupted?.();
    }
  });
}

export function playNarrationGuide(
  plan: WalkAudioPlan,
  locale: AudioGuideLocale,
  onFinished?: () => void,
  onModeChange?: (mode: AudioPlaybackMode) => void,
  onInterrupted?: () => void
) {
  const epoch = ++playbackEpoch;
  cleanupRecordedPlayer();

  Speech.stop()
    .catch(() => undefined)
    .then(async () => {
      if (epoch !== playbackEpoch) return;

      const fallback = () => {
        if (epoch !== playbackEpoch) return;
        cleanupRecordedPlayer();
        onModeChange?.('tts-fallback');
        speakNarrationFallback(plan.transcript, locale, epoch, onFinished, onInterrupted);
      };

      if (plan.mode !== 'recorded' || !plan.masterUrl) {
        fallback();
        return;
      }

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix'
        });
        if (epoch !== playbackEpoch) return;

        const player = createAudioPlayer(plan.masterUrl, {
          updateInterval: 250,
          downloadFirst: true
        });
        recordedPlayer = player;
        player.setActiveForLockScreen(true, {
          title: plan.displayTitle,
          artist: 'Moscow · Varvarka'
        });
        onModeChange?.('recorded');

        recordedSubscription = player.addListener('playbackStatusUpdate', (status) => {
          if (epoch !== playbackEpoch) return;
          if (status.error) {
            fallback();
            return;
          }
          if (status.didJustFinish) {
            cleanupRecordedPlayer();
            if (epoch === playbackEpoch) onFinished?.();
          }
        });

        player.play();
      } catch {
        fallback();
      }
    });
}

export async function stopNarrationGuide() {
  playbackEpoch += 1;
  cleanupRecordedPlayer();
  await Speech.stop().catch(() => undefined);
}

export function stopTextGuide() {
  return Speech.stop();
}
