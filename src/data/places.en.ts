import type { Place } from './places';

export const placeEnglish: Record<string, Partial<Place>> = {
  'romanov-chambers': {
    title: 'Chambers of the Romanov Boyars',
    subtitle: 'A house that changed together with Varvarka Street',
    district: 'Kitay-Gorod',
    shortStory: 'The opening point of the pilot: the building is explored through documented historical states, archival images and a future spatial reconstruction.',
    tags: ['architecture', '17th century', 'Varvarka'],
    highlights: [
      'compare the façades before and after the 19th-century restoration changes',
      'see which architectural details are supported by archival evidence',
      'connect the story of the house with the changing history of Varvarka Street'
    ],
    periods: [
      {
        id: 'romanov-1857',
        label: 'Before restoration',
        year: '1857',
        summary: 'An archival view provides documentary evidence for the state of the chambers before the restoration changes.',
        confidence: 'documented'
      },
      {
        id: 'romanov-1883',
        label: 'After the 19th-century transformations',
        year: '1883',
        summary: 'A late-19th-century photograph makes it possible to compare changes to the façades and surrounding urban environment.',
        confidence: 'documented'
      }
    ]
  },
  'old-english-court': {
    title: 'Old English Court',
    subtitle: 'Moscow trade and international connections',
    district: 'Zaryadye',
    shortStory: 'The second spatial scene of the pilot links 16th–17th century trading Moscow and early Anglo-Russian relations with later alterations and the restoration that returned the monument to view.',
    tags: ['trade', 'Zaryadye', 'urban life'],
    highlights: [
      'understand why an official English trading court appeared on Varvarka Street',
      'separate documented building history from the restoration-based reconstruction of its earlier appearance',
      'follow the transformation from trading court to modern museum'
    ],
    periods: [
      {
        id: 'english-court-1556',
        label: 'English trading court',
        year: '1556',
        summary: 'After the Muscovy Company was established, English merchants received a court on Varvarka. It became an important site of early Anglo-Russian trade and diplomacy.',
        confidence: 'documented'
      },
      {
        id: 'english-court-1960s',
        label: 'The monument rediscovered',
        year: '1960s',
        summary: 'Pyotr Baranovsky identified the old chambers beneath later alterations and secured their preservation. The early appearance seen today is therefore tied to scholarly restoration and is marked as reconstruction.',
        confidence: 'reconstructed'
      },
      {
        id: 'english-court-1994',
        label: 'Museum opens',
        year: '1994',
        summary: 'A museum of Anglo-Russian relations opened in the restored chambers; Queen Elizabeth II took part in the opening ceremony.',
        confidence: 'documented'
      }
    ]
  },
  'varvarka-gates': {
    title: 'Varvarsky Gates',
    subtitle: 'A vanished boundary of Kitay-Gorod',
    district: 'Kitay-Gorod',
    shortStory: 'A location designed to reveal a vanished part of the city structure and connect a historical map with the modern square.',
    tags: ['lost landmark', 'city wall', 'AR'],
    highlights: [
      'see a lost piece of the city boundary at the scale of the modern space',
      'understand where the Kitay-Gorod wall once ran',
      'compare the historic street structure with the square you see today'
    ]
  }
};

export function localizePlaces(places: Place[], language: 'ru' | 'en'): Place[] {
  if (language === 'ru') return places;
  return places.map((place) => ({ ...place, ...(placeEnglish[place.id] ?? {}) }));
}
