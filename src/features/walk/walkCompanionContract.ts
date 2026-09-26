import type { Place } from '../../data/places.ts';
import { tr, type AppLanguage } from '../../i18n/index.ts';

export function buildPlaceWalkNarration(place: Place, language: AppLanguage) {
  const look = place.highlights[0];
  return [
    place.title,
    place.shortStory,
    look
      ? tr(
          language,
          `Посмотрите вокруг. Ваша задача: ${look}.`,
          `Look around. Your task is to ${look}.`,
          `看看四周。你的观察任务：${look}。`
        )
      : tr(language, 'Осмотритесь вокруг.', 'Take a look around you.', '看看四周。')
  ].join(' ');
}

export function getObservationMission(place: Place, language: AppLanguage) {
  const prompt = place.highlights[0] ?? place.shortStory;
  return {
    id: `observation:${place.id}:v1`,
    prompt: tr(language, `Найдите глазами: ${prompt}`, `Look for this: ${prompt}`, `请在现场找到：${prompt}`)
  };
}

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
