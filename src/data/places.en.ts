import type { Place } from './places';

export const placeEnglish: Record<string, Partial<Place>> = {
  'church-st-barbara': {
    title: 'Church of St Barbara',
    subtitle: 'The church that gave Varvarka its name',
    district: 'Kitay-Gorod',
    shortStory: 'The western entry to the walk shows how one site can preserve the memory of 16th-century Moscow inside the classical city of the late 18th and early 19th centuries.',
    tags: ['architecture', 'trade', 'Varvarka'],
    highlights: [
      'understand why the street became known as Varvarka',
      'connect the stone church of 1514 with the wealthy Surozh merchant community',
      'see how Rodion Kazakov\'s later church retained the site of the earlier building'
    ],
    periods: [
      {
        id: 'st-barbara-1514',
        label: 'First stone church',
        year: '1514',
        summary: 'The stone Church of St Barbara was built by Aleviz Novy for wealthy Surozh merchants. Historical sources link this church with the street name Varvarka.',
        confidence: 'documented'
      },
      {
        id: 'st-barbara-1804',
        label: 'Classical church',
        year: '1796–1804',
        summary: 'The present building was erected to a design by Rodion Kazakov on the site of the earlier church, connecting two architectural periods in one location.',
        confidence: 'documented'
      }
    ]
  },
  'romanov-chambers': {
    title: 'Chambers of the Romanov Boyars',
    subtitle: 'A house that changed together with Varvarka Street',
    district: 'Kitay-Gorod',
    shortStory: 'A core spatial point of the pilot: the building is explored through documented historical states, archival images and an evidence-gated spatial reconstruction.',
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
  'znamensky-cathedral': {
    title: 'Znamensky Cathedral',
    subtitle: 'Cathedral of the Old Sovereign Court',
    district: 'Kitay-Gorod',
    shortStory: 'The cathedral links Varvarka with the Znamensky Monastery, the old Romanov estate and the major restoration campaigns of the 20th century.',
    tags: ['architecture', 'Romanovs', 'restoration'],
    highlights: [
      'see the architectural centre of the Znamensky Monastery ensemble',
      'understand the monastery\'s connection with the Romanov estate and royal patronage',
      'compare the 17th-century cathedral with later alterations and the scholarly restoration of the 1960s–1970s'
    ],
    periods: [
      {
        id: 'znamensky-1684',
        label: '17th-century cathedral',
        year: '1679–1684',
        summary: 'The existing cathedral was built in 1679–1684 and became the compositional centre of the Znamensky Monastery.',
        confidence: 'documented'
      },
      {
        id: 'znamensky-1970s',
        label: 'Historical form restored',
        year: '1963–1972',
        summary: 'A major scholarly restoration campaign returned the cathedral towards its late-17th-century architectural appearance after later alterations and uses.',
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
