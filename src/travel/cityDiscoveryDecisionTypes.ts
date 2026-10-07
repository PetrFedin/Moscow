export type OpeningHoursTruth = 'demo' | 'editorial' | 'partner' | 'provider' | 'unknown';

export type OpeningHoursInterval = {
  opens: string;
  closes: string;
};

export type OpeningHoursDay = {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  intervals: OpeningHoursInterval[];
};

export type OpeningHoursException = {
  date: string;
  closed?: boolean;
  intervals?: OpeningHoursInterval[];
};

export type OpeningHoursProfile = {
  timezone: 'Europe/Moscow';
  weekly: OpeningHoursDay[];
  exceptions?: OpeningHoursException[];
  truth: OpeningHoursTruth;
  freshnessAt?: string;
};

export type DiscoveryPriceClass = 'free' | 'budget' | 'mid' | 'premium' | 'unknown';

export type FamilyProfile = {
  familyFriendly: 'yes' | 'partial' | 'no' | 'unknown';
  minAge?: number;
  maxAge?: number;
  adultOnlyAfter?: string;
};

export type AccessibilityProfile = {
  stepFree: 'verified' | 'partial' | 'unknown' | 'not-available';
};

export type WeatherProfile = {
  suitability: 'indoor' | 'outdoor' | 'mixed' | 'unknown';
};

export type TravelEstimate = {
  minutes: number;
  mode: 'walk' | 'transit' | 'mixed';
  truth: 'demo' | 'provider' | 'unknown';
};

export type DiscoveryDecisionContext = {
  now: string;
  freeWindowMinutes: number;
  budgetPreference?: DiscoveryPriceClass;
  budgetStrict?: boolean;
  childrenAges?: number[];
  accessibilityIntent?: 'none' | 'preferred' | 'required';
  weather?: 'clear' | 'rain' | 'snow' | 'unknown';
  currentDistrict?: string;
  visitedDistricts?: string[];
  previousActivityKind?: string;
  travelByItemId?: Record<string, TravelEstimate>;
};

export type OpeningState = 'open' | 'closing-soon' | 'closed' | 'unknown';
export type PriceFit = 'good' | 'acceptable' | 'over-budget' | 'unknown';
export type FamilyFit = 'good' | 'caution' | 'ineligible' | 'unknown';
export type AccessibilityFit = 'good' | 'caution' | 'needs-verification' | 'ineligible' | 'unknown';
export type TravelFit = 'good' | 'tight' | 'not-worth-it' | 'does-not-fit' | 'unknown';
export type WeatherFit = 'good' | 'caution' | 'unknown';

export type DiscoveryDecision = {
  eligible: boolean;
  openingState: OpeningState;
  priceFit: PriceFit;
  familyFit: FamilyFit;
  accessibilityFit: AccessibilityFit;
  travelFit: TravelFit;
  weatherFit: WeatherFit;
  travelMinutes?: number;
  totalMinutes?: number;
  experienceShare?: number;
  decisionScore: number;
  positiveReasons: string[];
  cautions: string[];
  blockers: string[];
};
