import * as Speech from 'expo-speech';

export type AudioGuideLocale = 'ru-RU' | 'en-US';

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

export function stopTextGuide() {
  return Speech.stop();
}
