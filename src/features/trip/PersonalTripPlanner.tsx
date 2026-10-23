import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { moscowVarvarkaDestinationPackage } from '../../travel/moscowDestinationPackage';
import type { CuratedMoscowPlace } from '../../travel/curatedMoscowPlaces';
import { buildDayComposerProjection } from '../../travel/dayComposer';
import { buildDayComposerDisruptionCases } from '../../travel/dayComposerDisruption';
import {
  acceptDayReplacementProposal,
  buildDayReplacementProposals,
  type DayReplacementProposal
} from '../../travel/dayReplacementProposal';
import {
  verifyDayReplacementProposalRouting
} from '../../travel/replacementRoutingVerification';
import {
  projectValhallaRealSmokeReplay,
  valhallaRealSmokeReplayContext,
  VALHALLA_REAL_SMOKE_ENDPOINTS
} from '../../travel/routingEvidenceReplay';
import {
  projectTretyakovLiveCityReplay,
  tretyakovLiveCityReplayContext,
  TRETYAKOV_LIVE_CITY_CANONICAL_NODE_ID
} from '../../travel/liveCityTruthEvidenceReplay';
import {
  projectTretyakovProgrammeReplay,
  tretyakovProgrammeReplayContext,
  TRETYAKOV_PROGRAMME_CANONICAL_NODE_ID
} from '../../travel/liveProgrammeEvidenceReplay';
import {
  addDestinationNodeToTrip,
  addCuratedMoscowPlaceToTrip,
  addManualTripItem,
  createPersonalTrip,
  getUnseenDestinationNodes,
  parsePersonalTrip,
  personalTripDayItems,
  recordTripVisit,
  updateTripVisitNote,
  summarizePersonalTrip,
  type PersonalTrip,
  type PersonalTripCommitment,
  type PersonalTripItemKind
} from '../../travel/personalTrip';
import {
  moveTripItem,
  reorderTripDayItems
} from '../../travel/tripScheduler';
import { canMoveTripStopBetweenDays } from '../../travel/tripDayPresentation';
import { deriveWalkVisitCandidates } from '../../travel/walkVisitBridge';
import { manualMoscowInterval, moscowCalendarDay } from '../../travel/manualTripTime';
import PhysicalPressable from '../../ui/PhysicalPressable';
import TouristTodayCard from './TouristTodayCard';
import TripJourneyOverview from './TripJourneyOverview';
import TripFinanceCard from './TripFinanceCard';
import TripReadinessCard from './TripReadinessCard';
import TripAcceptanceHistoryCard from './TripAcceptanceHistoryCard';
import MoscowPassportCard from './MoscowPassportCard';
import BookingWalletCard from './BookingWalletCard';
import BookingResolutionCard from './BookingResolutionCard';
import CalendarInviteImportCard from './CalendarInviteImportCard';
import VenueServiceIntakeCard from './VenueServiceIntakeCard';
import TripArchivePanel from './TripArchivePanel';
import MoscowTravelHistoryCard from './MoscowTravelHistoryCard';
import { buildMoscowTravelHistory } from '../../travel/moscowTravelHistory';
import MoscowNextDiscoveriesCard from './MoscowNextDiscoveriesCard';
import TripBackupPanel from './TripBackupPanel';
import { createPersonalTripBackup, mergePersonalTripBackup, parsePersonalTripBackup, previewPersonalTripBackup } from '../../travel/personalTripBackup';
import {
  PERSONAL_TRIP_ACTIVE_STORAGE_KEY,
  PERSONAL_TRIP_TRANSACTION_STORAGE_KEY,
  readRecoveredTripStorage,
  transactTripStorage
} from '../../travel/personalTripTransaction';
import {
  PERSONAL_TRIP_ARCHIVE_STORAGE_KEY,
  emptyPersonalTripArchive,
  parsePersonalTripArchive,
  archivePersonalTrip,
  archivedPersonalTrip,
  archiveWithoutPersonalTrip,
  type PersonalTripArchive
} from '../../travel/personalTripArchive';
import TripPreferencesCard from './TripPreferencesCard';
import DayReplanCard from './DayReplanCard';
import DayComposerCard from './DayComposerCard';
import LiveDisruptionCard from './LiveDisruptionCard';
import ReplacementProposalCard from './ReplacementProposalCard';

export const PERSONAL_TRIP_STORAGE_KEY = PERSONAL_TRIP_ACTIVE_STORAGE_KEY;

type Props = {
  language: AppLanguage;
  savedIds: string[];
  visitedIds: string[];
  currentLiveDestinationProjection?: ReturnType<typeof import('../../travel/liveDestinationAuthority').projectLiveDestinationFeed>;
  currentRoutingProjection?: ReturnType<typeof import('../../travel/citywideRoutingAuthority').projectCitywideRoutingFeed>;
  currentRoutingAuthorityUrl?: string;
  onOpenPlace: (placeId: string) => void;
  onDiscover: () => void;
  selectedDirectoryPlace?: CuratedMoscowPlace | null;
  onDirectoryPlaceHandled?: () => void;
};

type CommitmentChoice = 'none' | 'ticket' | 'reservation';

const durationOptions = [1, 2, 3, 5, 7] as const;
const manualKinds: PersonalTripItemKind[] = [
  'museum',
  'gallery',
  'exhibition',
  'cinema',
  'concert',
  'food',
  'cafe',
  'event',
  'theatre',
  'bar',
  'activity',
  'wellness',
  'stay',
  'transport',
  'shopping',
  'other'
];

const kindLabels: Record<AppLanguage, Partial<Record<PersonalTripItemKind, string>>> = {
  ru: {
    museum: 'Музей',
    gallery: 'Галерея',
    exhibition: 'Выставка',
    cinema: 'Кино',
    concert: 'Концерт',
    cafe: 'Кафе',
    wellness: 'Студия / услуга',
    food: 'Ресторан',
    event: 'Событие',
    theatre: 'Театр',
    bar: 'Бар',
    activity: 'Активность',
    stay: 'Отель',
    transport: 'Транспорт',
    shopping: 'Покупки',
    other: 'Другое'
  },
  en: {
    museum: 'Museum',
    gallery: 'Gallery',
    exhibition: 'Exhibition',
    cinema: 'Cinema',
    concert: 'Concert',
    cafe: 'Cafe',
    wellness: 'Studio / service',
    food: 'Restaurant',
    event: 'Event',
    theatre: 'Theatre',
    bar: 'Bar',
    activity: 'Activity',
    stay: 'Stay',
    transport: 'Transport',
    shopping: 'Shopping',
    other: 'Other'
  },
  zh: {
    museum: '博物馆',
    gallery: '美术馆',
    exhibition: '展览',
    cinema: '电影院',
    concert: '音乐会',
    cafe: '咖啡馆',
    wellness: '工作室 / 服务',
    food: '餐厅',
    event: '活动',
    theatre: '剧院',
    bar: '酒吧',
    activity: '体验',
    stay: '住宿',
    transport: '交通',
    shopping: '购物',
    other: '其他'
  }
};

function localDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function moscowDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : localDateOnly(date);
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function tripId(startDate: string) {
  return `moscow-trip:${startDate}:${Date.now().toString(36)}`;
}

function itemId(prefix: string) {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function visitTimestamp(dayDate: string) {
  return dayDate === moscowDateOnly()
    ? new Date().toISOString()
    : `${dayDate}T12:00:00+03:00`;
}

function shortDay(language: AppLanguage, dateOnly: string) {
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

function timeLabel(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(parsed);
}

function moscowTimeLabel(language: AppLanguage, value: string) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(new Date(value));
}

function nodeTitle(language: AppLanguage, node: typeof moscowVarvarkaDestinationPackage.nodes[number]) {
  if (language === 'en') return node.titleEn ?? node.titleRu;
  if (language === 'zh') return node.titleZh ?? node.titleRu;
  return node.titleRu;
}

export default function PersonalTripPlanner({
  language,
  savedIds,
  visitedIds,
  currentLiveDestinationProjection,
  currentRoutingProjection,
  currentRoutingAuthorityUrl,
  onOpenPlace,
  onDiscover,
  selectedDirectoryPlace,
  onDirectoryPlaceHandled
}: Props) {
  const [trip, setTrip] = useState<PersonalTrip | null>(null);
  const [archive, setArchive] = useState<PersonalTripArchive>(emptyPersonalTripArchive());
  const [archiveReady, setArchiveReady] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [storageBusy, setStorageBusy] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  const storageOperationRef = useRef(false);
  const activeWritesRef = useRef<Promise<void>>(Promise.resolve());
  const persistedTripRef = useRef<PersonalTrip | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => moscowCalendarDay());
  const [startDateInput, setStartDateInput] = useState(() => moscowCalendarDay());
  const [durationDays, setDurationDays] = useState<(typeof durationOptions)[number]>(3);
  const [manualOpen, setManualOpen] = useState(false);
  const [tripToolsOpen, setTripToolsOpen] = useState(false);
  const [bookingHelpOpen, setBookingHelpOpen] = useState(false);
  const [bookingHelpItemId, setBookingHelpItemId] = useState<string | undefined>(undefined);
  const [bookingHelpAfterReadiness, setBookingHelpAfterReadiness] = useState(false);
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const [eraseAllCopiesConfirm, setEraseAllCopiesConfirm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualKind, setManualKind] = useState<PersonalTripItemKind>('event');
  const [manualTime, setManualTime] = useState('19:00');
  const [manualEndTime, setManualEndTime] = useState('21:00');
  const [commitmentChoice, setCommitmentChoice] = useState<CommitmentChoice>('none');
  const [manualReference, setManualReference] = useState('');
  const [manualProvider, setManualProvider] = useState('');
  const [manualPartySize, setManualPartySize] = useState('');
  const [manualSeats, setManualSeats] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualExternalUrl, setManualExternalUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [discoveryActionError, setDiscoveryActionError] = useState('');
  const [replacementActionError, setReplacementActionError] = useState('');
  const [verifiedReplacementRoutingProjection, setVerifiedReplacementRoutingProjection] = useState<
    ReturnType<typeof import('../../travel/citywideRoutingAuthority').projectCitywideRoutingFeed> | null
  >(null);
  const [verifyingProposalId, setVerifyingProposalId] = useState<string | null>(null);

  useEffect(() => {
    // Hydrate BOTH keys together after replaying an interrupted journal. A
    // corrupt journal or conflicting foreign edit must block the UI, not cause
    // an apparently empty trip to overwrite user records.
    readRecoveredTripStorage(AsyncStorage)
      .then(({ activeTrip, archive: savedArchive, recovered }) => {
        persistedTripRef.current = activeTrip;
        setArchive(savedArchive);
        setTrip(activeTrip);
        setRecoveryNotice(recovered);
        if (activeTrip) {
          setSelectedDay(
            activeTrip.days.includes(moscowCalendarDay())
              ? moscowCalendarDay()
              : activeTrip.days[0] ?? activeTrip.startDate
          );
        }
      })
      .catch(() => setArchiveError('trip-storage-recovery-blocked'))
      .finally(() => {
        setHydrated(true);
        setArchiveReady(true);
      });
  }, []);

  useEffect(() => {
    if (!hydrated || !trip || archiveError || storageOperationRef.current) return;
    const snapshot = JSON.stringify(trip);
    // Revision-level journal and expected prior snapshot protect against
    // stale edits from another tab, interrupted writes and archive interleaves.
    // This remains same-runtime serialization, NOT cross-tab atomicity.
    const pending = activeWritesRef.current.then(async () => {
      const nextTrip = parsePersonalTrip(snapshot);
      const stored = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'edit',
        id: 'edit:' + nextTrip.id + ':' + nextTrip.updatedAt,
        expectedActiveTrip: persistedTripRef.current,
        transform: ({ activeTrip, archive: savedArchive }) => {
          if (activeTrip && activeTrip.id !== nextTrip.id) {
            throw new Error('Active trip identity changed during autosave');
          }
          return { activeTrip: nextTrip, archive: savedArchive, result: true };
        }
      });
      persistedTripRef.current = stored.activeTrip;
    });
    activeWritesRef.current = pending;
    void pending.catch(() => {
      setFormError('trip-local-save-failed');
      setArchiveError('trip-local-save-failed');
    });
  }, [hydrated, trip, archiveError]);

  const walkVisitCandidates = useMemo(() => trip
    ? deriveWalkVisitCandidates({
        trip,
        walkVisitedIds: visitedIds,
        dayDate: moscowDateOnly(),
        todayInDestination: moscowDateOnly()
      })
    : [], [trip, visitedIds]);


  const summary = useMemo(() => trip ? summarizePersonalTrip(trip) : null, [trip]);
  const activeItems = useMemo(
    () => trip && trip.days.includes(selectedDay) ? personalTripDayItems(trip, selectedDay) : [],
    [selectedDay, trip]
  );
  const knownVisitedNodeIds = useMemo(() => {
    // A stored visit from any past trip is not a fresh destination recommendation.
    // Only canonical DestinationPackage identities qualify; text notes do not.
    if (!archiveReady || archiveError) return visitedIds;
    const history = buildMoscowTravelHistory({ activeTrip: trip, archive });
    const fromPreviousTrips = history.entries.flatMap((entry) => (
      entry.knownPlaceId?.startsWith('destination:')
        ? [entry.knownPlaceId.slice('destination:'.length)]
        : []
    ));
    return [...new Set([...visitedIds, ...fromPreviousTrips])];
  }, [trip, archive, archiveReady, archiveError, visitedIds]);
  const unseen = useMemo(
    () => trip && archiveReady && !archiveError
      ? getUnseenDestinationNodes({
          pkg: moscowVarvarkaDestinationPackage,
          trip,
          visitedDestinationNodeIds: knownVisitedNodeIds
        })
      : [],
    [trip, knownVisitedNodeIds, archiveReady, archiveError]
  );
  const savedNodes = useMemo(
    () => moscowVarvarkaDestinationPackage.nodes.filter((node) => savedIds.includes(node.id)),
    [savedIds]
  );
  const visitByItemId = useMemo(
    () => new Map((trip?.visits ?? []).flatMap((visit) => visit.itemId ? [[visit.itemId, visit] as const] : [])),
    [trip]
  );
  const replayRoutingProjection = useMemo(() => {
    if (!trip || !trip.days.includes(selectedDay)) return null;
    if (!trip.id.startsWith('routing-evidence-replay:')) return null;

    const scheduled = personalTripDayItems(trip, selectedDay)
      .filter((item) => item.plannedStartAt && item.plannedEndAt)
      .sort((a, b) =>
        Date.parse(a.plannedStartAt!) - Date.parse(b.plannedStartAt!)
        || a.id.localeCompare(b.id)
      );

    const hasEvidencePair = scheduled.some((item, index) => {
      const next = scheduled[index + 1];
      return item.destinationNodeId === VALHALLA_REAL_SMOKE_ENDPOINTS.from.id
        && next?.destinationNodeId === VALHALLA_REAL_SMOKE_ENDPOINTS.to.id;
    });

    return hasEvidencePair ? projectValhallaRealSmokeReplay() : null;
  }, [selectedDay, trip]);

  const replayLiveCityProjection = useMemo(() => {
    if (!trip || !trip.days.includes(selectedDay)) return null;
    if (!trip.id.startsWith('live-city-evidence-replay:')) return null;
    const hasTretyakov = personalTripDayItems(trip, selectedDay)
      .some((item) => item.destinationNodeId === TRETYAKOV_LIVE_CITY_CANONICAL_NODE_ID);
    return hasTretyakov ? projectTretyakovLiveCityReplay() : null;
  }, [selectedDay, trip]);

  const replayProgrammeProjection = useMemo(() => {
    if (!trip || !trip.days.includes(selectedDay)) return null;
    if (!trip.id.startsWith('live-programme-evidence-replay:')) return null;
    const hasProgramme = personalTripDayItems(trip, selectedDay)
      .some((item) => item.destinationNodeId === TRETYAKOV_PROGRAMME_CANONICAL_NODE_ID);
    return hasProgramme ? projectTretyakovProgrammeReplay() : null;
  }, [selectedDay, trip]);

  const liveProjection = replayProgrammeProjection ?? replayLiveCityProjection ?? currentLiveDestinationProjection ?? null;
  const liveEvidenceContext = replayProgrammeProjection
    ? {
        mode: tretyakovProgrammeReplayContext.mode,
        evidenceRef: tretyakovProgrammeReplayContext.evidenceRef
      }
    : replayLiveCityProjection
      ? {
          mode: tretyakovLiveCityReplayContext.mode,
          evidenceRef: tretyakovLiveCityReplayContext.evidenceRef
        }
      : currentLiveDestinationProjection
        ? { mode: 'live' as const }
        : undefined;

  const dayComposer = useMemo(
    () => trip && trip.days.includes(selectedDay)
      ? buildDayComposerProjection({
          trip,
          dayDate: selectedDay,
          minimumFreeMinutes: 30,
          ...(replayRoutingProjection
            ? {
                routingProjection: replayRoutingProjection,
                routingEvidenceContext: {
                  mode: valhallaRealSmokeReplayContext.mode,
                  evidenceRef: valhallaRealSmokeReplayContext.evidenceRef
                }
              }
            : {}),
          ...(liveProjection
            ? {
                liveDestinationProjection: liveProjection,
                ...(liveEvidenceContext ? { liveEvidenceContext } : {})
              }
            : {})
        })
      : null,
    [selectedDay, trip, replayRoutingProjection, liveProjection, liveEvidenceContext]
  );

  const liveDisruptions = useMemo(
    () => dayComposer ? buildDayComposerDisruptionCases(dayComposer) : [],
    [dayComposer]
  );

  const replacementProposalSets = useMemo(() => {
    if (!trip || !dayComposer || !liveProjection || liveDisruptions.length === 0) return [];
    const routingProjection =
      replayRoutingProjection
      ?? currentRoutingProjection
      ?? verifiedReplacementRoutingProjection
      ?? undefined;
    return liveDisruptions.map((disruption) => buildDayReplacementProposals({
      trip,
      dayProjection: dayComposer,
      disruption,
      liveProjection,
      ...(routingProjection ? { routingProjection } : {})
    }));
  }, [
    trip,
    dayComposer,
    liveProjection,
    liveDisruptions,
    replayRoutingProjection,
    currentRoutingProjection,
    verifiedReplacementRoutingProjection
  ]);

  const verifyReplacementRouting = async (proposal: DayReplacementProposal) => {
    if (!currentRoutingAuthorityUrl || !liveProjection) {
      setReplacementActionError('current-routing-authority-unavailable');
      return;
    }

    setReplacementActionError('');
    setVerifyingProposalId(proposal.id);
    try {
      const verification = await verifyDayReplacementProposalRouting({
        proposal,
        authorityUrl: currentRoutingAuthorityUrl,
        liveEntities: liveProjection.entities,
        nowIso: new Date().toISOString()
      });

      if (verification.status === 'blocked') {
        setReplacementActionError(
          verification.blocker === 'geometry-missing'
            ? `geometry-missing:${verification.missingNodeIds.join(',')}`
            : 'replacement-routing-blocked'
        );
        return;
      }

      setVerifiedReplacementRoutingProjection(verification.projection);
      setReplacementActionError('');
    } catch (error) {
      setReplacementActionError(error instanceof Error ? error.message : 'replacement-routing-verification-failed');
    } finally {
      setVerifyingProposalId(null);
    }
  };

  const acceptReplacement = async (proposal: DayReplacementProposal): Promise<void> => {
    if (!trip) throw new Error('Active trip unavailable');
    const disruption = liveDisruptions.find((item) => item.id === proposal.disruptionId);
    if (!disruption) throw new Error('Replacement disruption is no longer current');

    try {
      const accepted = acceptDayReplacementProposal({
        trip,
        disruption,
        proposal,
        acceptedAt: new Date().toISOString()
      });
      // Acceptance is evidence-bearing: preserve fixed tickets and save the
      // before/after receipt before exposing the revised itinerary in the UI.
      // On write failure the original trip, proposal and verification remain.
      await persistVisitorAction(accepted.trip, 'replacement');
      setSelectedDay(accepted.trip.items.find((item) => item.id === accepted.receipt.affectedItemId)?.dayDate ?? selectedDay);
      setVerifiedReplacementRoutingProjection(null);
      setReplacementActionError('');
    } catch (error) {
      setReplacementActionError(error instanceof Error ? error.message : 'replacement-acceptance-failed');
      throw error;
    }
  };

  const openAddPreset = (preset: 'place' | 'restaurant' | 'ticket' | 'reservation' | 'event') => {
    setFormError('');
    setCommitmentChoice('none');

    if (preset === 'restaurant') {
      setManualKind('food');
      setCommitmentChoice('reservation');
      setManualTitle('');
    } else if (preset === 'ticket') {
      setManualKind('event');
      setCommitmentChoice('ticket');
      setManualTitle('');
    } else if (preset === 'reservation') {
      setManualKind('food');
      setCommitmentChoice('reservation');
      setManualTitle('');
    } else if (preset === 'event') {
      setManualKind('event');
      setManualTitle('');
    } else {
      setManualKind('activity');
      setManualTitle('');
    }

    setManualOpen(true);
  };

  const createTrip = async () => {
    if (!hydrated || !archiveReady || archiveError || trip || storageOperationRef.current) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateInput)) {
      setFormError('invalid-arrival-date');
      return;
    }
    const createdAt = new Date().toISOString();
    let next: PersonalTrip;
    try {
      next = createPersonalTrip({
        id: tripId(startDateInput),
        destinationId: 'moscow',
        title: tr(language, 'Моя поездка в Москву', 'My Moscow trip', '我的莫斯科之旅'),
        startDate: startDateInput,
        endDate: addDays(startDateInput, durationDays - 1),
        createdAt
      });
    } catch {
      setFormError('invalid-trip-date-range');
      return;
    }
    if (!beginStorageOperation()) return;
    try {
      await activeWritesRef.current;
      // The trip becomes visible ONLY after its first revision is persisted.
      // If a second tab created an active trip, fail closed instead of replacing it.
      const result = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'edit',
        id: 'create:' + next.id,
        expectedActiveTrip: null,
        transform: ({ activeTrip, archive: savedArchive }) => {
          if (activeTrip) throw new Error('Active trip already exists');
          return { activeTrip: next, archive: savedArchive, result: true };
        }
      });
      persistedTripRef.current = result.activeTrip;
      setTrip(result.activeTrip);
      setSelectedDay(next.days[0] ?? startDateInput);
      setFormError('');
    } catch {
      setFormError('trip-create-storage-error');
      setArchiveError('trip-storage-recovery-required');
    } finally {
      endStorageOperation();
    }
  };

  const addNode = async (nodeId: string): Promise<void> => {
    if (!trip) return;
    const node = moscowVarvarkaDestinationPackage.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    if (trip.items.some((item) => item.destinationNodeId === nodeId && item.dayDate === selectedDay)) return;
    try {
      const next = addDestinationNodeToTrip({
        trip,
        node,
        itemId: itemId(`node:${node.id}`),
        dayDate: selectedDay,
        updatedAt: new Date().toISOString()
      });
      await persistVisitorAction(next, 'node');
    } catch (error) {
      setHistoryError(tr(language,
        'Не удалось добавить место в маршрут. Проверьте сохранение и повторите попытку.',
        'Could not save the place to your trip. Check storage and retry.',
        '未能将地点保存到行程，请检查存储后重试。'));
    }
  };

  const addDirectoryPlace = async (): Promise<void> => {
    if (!trip || !selectedDirectoryPlace) return;
    try {
      const next = addCuratedMoscowPlaceToTrip({
        trip,
        place: selectedDirectoryPlace,
        itemId: itemId('directory'),
        dayDate: selectedDay,
        updatedAt: new Date().toISOString()
      });
      await persistVisitorAction(next, 'directory');
      onDirectoryPlaceHandled?.();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'place-add-failed');
    }
  };

  const addSuggestedPlace = async (place: CuratedMoscowPlace): Promise<void> => {
    if (!trip || !trip.days.includes(selectedDay) || !archiveReady || archiveError) {
      setDiscoveryActionError(tr(language, 'История поездок пока недоступна.', 'Trip history is not available.', '旅行历史记录暂不可用。'));
      return;
    }
    try {
      const next = addCuratedMoscowPlaceToTrip({
        trip,
        place,
        itemId: itemId('discovery'),
        dayDate: selectedDay,
        updatedAt: new Date().toISOString()
      });
      await persistVisitorAction(next, 'discovery');
      setDiscoveryActionError('');
    } catch (error) {
      setDiscoveryActionError(tr(language,
        'Место не добавлено. Возможно, оно уже в плане либо возникла ошибка сохранения. Проверьте и повторите.',
        'Place not added. It may already be in the plan, or saving failed. Check and retry.',
        '地点未添加。可能已在计划中，或保存失败，请检查后重试。'));
    }
  };

  const addManual = async () => {
    if (!trip || !manualTitle.trim()) return;
    const now = new Date().toISOString();
    const commitment: PersonalTripCommitment | undefined = commitmentChoice === 'none'
      ? undefined
      : {
          kind: commitmentChoice,
          status: 'confirmed',
          verification: 'user-declared',
          ...(manualReference.trim() ? { reference: manualReference.trim() } : {}),
          ...(manualProvider.trim() ? { provider: manualProvider.trim() } : {}),
          ...(manualPartySize.trim() ? { partySize: Number(manualPartySize.trim()) } : {}),
          ...(manualSeats.trim() ? { seats: manualSeats.trim() } : {}),
          ...(manualAddress.trim() ? { address: manualAddress.trim() } : {}),
          ...(manualExternalUrl.trim() ? { externalUrl: manualExternalUrl.trim() } : {})
        };

    try {
      setFormError('');
      const next = addManualTripItem({
        trip,
        itemId: itemId('manual'),
        dayDate: selectedDay,
        title: manualTitle,
        kind: manualKind,
        ...manualMoscowInterval(selectedDay, manualTime, manualEndTime),
        updatedAt: now,
        ...(commitment ? { commitment } : {})
      });
      await persistVisitorAction(next, 'manual');
      setManualTitle('');
      setManualReference('');
      setManualProvider('');
      setManualPartySize('');
      setManualSeats('');
      setManualAddress('');
      setManualExternalUrl('');
      setManualTime('19:00');
      setManualEndTime('21:00');
      setCommitmentChoice('none');
      setManualOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'invalid-trip-item');
      return;
    }
  };

  const moveItemToAdjacentDay = async (tripItemId: string, offset: -1 | 1): Promise<void> => {
    if (!trip) return;
    const item = trip.items.find((candidate) => candidate.id === tripItemId);
    if (!item || visitByItemId.has(item.id)) return;
    if (!canMoveTripStopBetweenDays(item)) {
      setFormError('ticket-date-requires-provider-confirmation');
      return;
    }
    const currentIndex = trip.days.indexOf(item.dayDate);
    const targetDay = trip.days[currentIndex + offset];
    if (!targetDay) return;
    try {
      const next = moveTripItem({
        trip,
        itemId: item.id,
        targetDayDate: targetDay,
        updatedAt: new Date().toISOString()
      });
      await persistVisitorAction(next, 'move-day');
    } catch {
      setHistoryError(tr(language,
        'Перенос не сохранён. Исходный день и билеты не изменены — повторите попытку.',
        'Move not saved. The original day and tickets remain unchanged; please retry.',
        '移动未保存。原日期和门票未改变，请重试。'));
    }
  };

  const reorderItem = async (tripItemId: string, offset: -1 | 1): Promise<void> => {
    if (!trip) return;
    const ids = activeItems.map((item) => item.id);
    const index = ids.indexOf(tripItemId);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    try {
      const next = reorderTripDayItems({
        trip,
        dayDate: selectedDay,
        orderedItemIds: ids,
        updatedAt: new Date().toISOString()
      });
      await persistVisitorAction(next, 'reorder');
    } catch {
      setHistoryError(tr(language,
        'Порядок мест не сохранён. Исходный план сохранён — повторите попытку.',
        'Place order not saved. Your original itinerary remains; please retry.',
        '地点顺序未保存，原行程保持不变，请重试。'));
    }
  };

  const beginStorageOperation = () => {
    if (!hydrated || !archiveReady || archiveError || storageOperationRef.current) return false;
    storageOperationRef.current = true;
    setStorageBusy(true);
    return true;
  };

  const endStorageOperation = () => {
    storageOperationRef.current = false;
    setStorageBusy(false);
  };

  const archiveAndCreateNew = async () => {
    if (!trip || !beginStorageOperation()) {
      setFormError('trip-archive-not-ready');
      return;
    }
    try {
      await activeWritesRef.current;
      const outcome = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'archive',
        id: 'archive:' + trip.id + ':' + new Date().toISOString(),
        expectedActiveTrip: trip,
        transform: ({ activeTrip, archive: savedArchive }) => {
          if (!activeTrip) throw new Error('Active trip disappeared');
          return {
            activeTrip: null,
            archive: archivePersonalTrip(savedArchive, activeTrip),
            result: activeTrip.id
          };
        }
      });
      persistedTripRef.current = null;
      setArchive(outcome.archive);
      setTrip(null);
      setResetConfirmationOpen(false);
      onDirectoryPlaceHandled?.();
      setFormError('');
    } catch {
      setFormError('trip-archive-write-failed');
      setArchiveError('trip-storage-recovery-required');
    } finally {
      endStorageOperation();
    }
  };

  const openPreviousTrip = async (tripIdToOpen: string) => {
    if (!beginStorageOperation()) {
      setFormError('trip-archive-not-ready');
      return;
    }
    try {
      await activeWritesRef.current;
      const outcome = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'switch',
        id: 'switch:' + tripIdToOpen + ':' + new Date().toISOString(),
        expectedActiveTrip: trip,
        transform: ({ activeTrip, archive: savedArchive }) => {
          const requested = archivedPersonalTrip(savedArchive, tripIdToOpen);
          if (!requested) throw new Error('Archived trip not found');
          return {
            activeTrip: requested,
            archive: activeTrip
              ? archivePersonalTrip(savedArchive, activeTrip)
              : savedArchive,
            result: requested.id
          };
        }
      });
      const nextTrip = outcome.activeTrip;
      if (!nextTrip) throw new Error('Recovered trip missing');
      persistedTripRef.current = nextTrip;
      setArchive(outcome.archive);
      setTrip(nextTrip);
      onDirectoryPlaceHandled?.();
      setSelectedDay(nextTrip.days.includes(moscowDateOnly())
        ? moscowDateOnly()
        : nextTrip.days[0] ?? nextTrip.startDate);
      setResetConfirmationOpen(false);
      setTripToolsOpen(false);
      setFormError('');
    } catch {
      setFormError('archived-trip-restore-failed');
      setArchiveError('trip-storage-recovery-required');
    } finally {
      endStorageOperation();
    }
  };

  const deleteActiveTrip = async () => {
    if (!trip || !beginStorageOperation()) {
      setFormError('trip-delete-not-ready');
      return;
    }
    try {
      await activeWritesRef.current;
      const outcome = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'delete',
        id: 'delete:' + trip.id + ':' + new Date().toISOString(),
        expectedActiveTrip: trip,
        transform: ({ archive: savedArchive }) => ({
          activeTrip: null, archive: savedArchive, result: true
        })
      });
      persistedTripRef.current = null;
      setArchive(outcome.archive);
      setTrip(null);
      setResetConfirmationOpen(false);
      onDirectoryPlaceHandled?.();
      setFormError('');
    } catch {
      setFormError('trip-delete-storage-error');
      setArchiveError('trip-storage-recovery-required');
    } finally {
      endStorageOperation();
    }
  };

  const eraseAllLocalTripCopies = async () => {
    if (!trip || !beginStorageOperation()) {
      setFormError('trip-erase-not-ready');
      return;
    }
    try {
      await activeWritesRef.current;
      const outcome = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'delete',
        id: 'erase-all-local:' + trip.id + ':' + new Date().toISOString(),
        expectedActiveTrip: trip,
        transform: ({ archive: savedArchive }) => ({
          activeTrip: null,
          archive: archiveWithoutPersonalTrip(savedArchive, trip.id),
          result: true
        })
      });
      persistedTripRef.current = null;
      setArchive(outcome.archive);
      setTrip(null);
      setResetConfirmationOpen(false);
      setEraseAllCopiesConfirm(false);
      setBookingHelpOpen(false);
      setBookingHelpItemId(undefined);
      onDirectoryPlaceHandled?.();
      setFormError('');
    } catch {
      setFormError('trip-erase-storage-error');
      setArchiveError('trip-storage-recovery-required');
    } finally {
      endStorageOperation();
    }
  };

  const exportTripBackup = async (): Promise<string> => {
    if (!hydrated || !archiveReady || archiveError || storageOperationRef.current) {
      throw new Error('Archive not ready');
    }
    await activeWritesRef.current;
    const saved = await readRecoveredTripStorage(AsyncStorage);
    if (JSON.stringify(saved.activeTrip) !== JSON.stringify(trip)) {
      throw new Error('Active trip not yet durably saved');
    }
    return createPersonalTripBackup({
      activeTrip: saved.activeTrip, archive: saved.archive, exportedAt: new Date().toISOString()
    });
  };

  const importTripBackup = async (raw: string): Promise<{ imported: number; skipped: number }> => {
    if (!beginStorageOperation()) throw new Error('Archive not ready');
    setBackupBusy(true);
    try {
      const incoming = parsePersonalTripBackup(raw);
      await activeWritesRef.current;
      const outcome = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'import',
        id: 'import:' + new Date().toISOString(),
        expectedActiveTrip: trip,
        transform: ({ activeTrip, archive: savedArchive }) => {
          const merged = mergePersonalTripBackup({
            backup: incoming, activeTrip, archive: savedArchive
          });
          return {
            activeTrip,
            archive: merged.archive,
            result: { imported: merged.imported, skipped: merged.skipped }
          };
        }
      });
      setArchive(outcome.archive);
      return outcome.result;
    } catch (error) {
      // Parse errors have no journal. If a journal exists (or its read fails),
      // block further writes and recover on the next app start.
      try {
        if (await AsyncStorage.getItem(PERSONAL_TRIP_TRANSACTION_STORAGE_KEY)) {
          setArchiveError('trip-storage-recovery-required');
        }
      } catch {
        setArchiveError('trip-storage-recovery-required');
      }
      throw error;
    } finally {
      setBackupBusy(false);
      endStorageOperation();
    }
  };

  // Calendar imports must commit to durable local storage BEFORE their
  // preview and pasted invitation are discarded. A React state update is not
  // proof that a ticket or plan survived a storage failure or another tab.
  const persistCalendarImport = async (nextTrip: PersonalTrip): Promise<void> => {
    if (!trip || !beginStorageOperation()) {
      throw new Error('Trip storage is unavailable; calendar event was not saved');
    }
    try {
      await activeWritesRef.current;
      if (nextTrip.id !== trip.id) throw new Error('Calendar import trip identity changed');
      const saved = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'edit',
        id: 'calendar-import:' + nextTrip.id + ':' + nextTrip.updatedAt,
        expectedActiveTrip: trip,
        transform: ({ activeTrip, archive: savedArchive }) => {
          if (!activeTrip || activeTrip.id !== nextTrip.id) {
            throw new Error('Active trip changed during calendar import');
          }
          return { activeTrip: nextTrip, archive: savedArchive, result: true };
        }
      });
      persistedTripRef.current = saved.activeTrip;
      setTrip(saved.activeTrip);
      setFormError('');
    } catch (error) {
      // A failed, interrupted journal must be recovered before any new edit;
      // otherwise leave the modal and raw invitation intact for an explicit retry.
      try {
        if (await AsyncStorage.getItem(PERSONAL_TRIP_TRANSACTION_STORAGE_KEY)) {
          setArchiveError('trip-storage-recovery-required');
        }
      } catch {
        setArchiveError('trip-storage-recovery-required');
      }
      throw error;
    } finally {
      endStorageOperation();
    }
  };

  /**
   * A finance draft survives in the mounted child component while the traveler
   * explicitly reloads the authoritative persisted trip after a stale-tab
   * conflict. NEVER resolve such a conflict by overwriting the other tab's
   * stored snapshot with a stale local trip.
   */
  const refreshStoredTripForFinance = async (): Promise<void> => {
    if (!trip || !beginStorageOperation()) {
      throw new Error('Financial recovery is unavailable while storage is blocked');
    }
    try {
      // An earlier queued autosave can reject after a CAS conflict; that
      // rejection must not stop an explicit validated read of stored data.
      await activeWritesRef.current.catch(() => undefined);
      const recovered = await readRecoveredTripStorage(AsyncStorage);
      if (!recovered.activeTrip || recovered.activeTrip.id !== trip.id) {
        throw new Error('Active journey changed; cannot silently import another journey');
      }
      persistedTripRef.current = recovered.activeTrip;
      activeWritesRef.current = Promise.resolve();
      setArchive(recovered.archive);
      setTrip(recovered.activeTrip);
      setSelectedDay(day => recovered.activeTrip!.days.includes(day)
        ? day : recovered.activeTrip!.days[0] ?? recovered.activeTrip!.startDate);
      setRecoveryNotice(recovered.recovered);
      setHistoryError('');
      setFormError('');
      // Financial draft fields stay mounted; the user decides whether to retry.
    } finally {
      endStorageOperation();
    }
  };

  /**
   * Critical visitor actions are shown as completed only after the active
   * trip and its archive journal have been durably written and read back.
   * Ordinary optimistic edits still use the queued autosave effect; tickets,
   * personal check-ins and notes must NOT clear their form before this proof.
   */
  const persistVisitorAction = async (
    nextTrip: PersonalTrip,
    action: 'manual' | 'visit' | 'note' | 'replacement' | 'booking' | 'replan' | 'preferences' | 'node' | 'directory' | 'discovery' | 'move-day' | 'reorder' | 'finance'
  ): Promise<void> => {
    if (!trip || !beginStorageOperation()) {
      setHistoryError(tr(language, 'Локальное хранилище недоступно. Изменение не сохранено.',
        'Local storage is unavailable. The change was not saved.',
        '本地存储不可用，变更未保存。'));
      throw new Error('Trip storage unavailable for visitor action');
    }
    try {
      await activeWritesRef.current;
      if (trip.id !== nextTrip.id) throw new Error('Active trip identity changed during visitor action');
      const outcome = await transactTripStorage({
        storage: AsyncStorage,
        operation: 'edit',
        id: action + ':' + nextTrip.id + ':' + nextTrip.updatedAt,
        expectedActiveTrip: trip,
        transform: ({ activeTrip, archive: savedArchive }) => {
          if (!activeTrip || activeTrip.id !== nextTrip.id) {
            throw new Error('Active trip changed before visitor action was saved');
          }
          return { activeTrip: nextTrip, archive: savedArchive, result: true };
        }
      });
      persistedTripRef.current = outcome.activeTrip;
      setTrip(outcome.activeTrip);
      setHistoryError('');
      setFormError('');
    } catch (error) {
      setHistoryError(tr(language,
        'Не удалось подтвердить сохранение. Исходные данные оставлены для повторной попытки. Не очищайте память приложения.',
        'Saving could not be verified. Your input is retained for retry. Do not clear the app storage.',
        '无法确认保存。已保留输入以便重试，请勿清除应用存储。'));
      try {
        if (await AsyncStorage.getItem(PERSONAL_TRIP_TRANSACTION_STORAGE_KEY)) {
          setArchiveError('trip-storage-recovery-required');
        }
      } catch {
        setArchiveError('trip-storage-recovery-required');
      }
      throw error;
    } finally {
      endStorageOperation();
    }
  };

  const backupPanel = (
    <TripBackupPanel
      language={language}
      busy={backupBusy || storageBusy || !archiveReady || !hydrated || Boolean(archiveError)}
      error={archiveError ? 'local-archive-unavailable' : ''}
      onExport={exportTripBackup}
      onPreview={previewPersonalTripBackup}
      onImport={importTripBackup}
    />
  );

  const markVisited = async (tripItemId: string): Promise<void> => {
    if (!trip) throw new Error('Active trip unavailable');
    const item = trip.items.find((candidate) => candidate.id === tripItemId);
    if (!item) throw new Error('Trip item unavailable');

    const at = visitTimestamp(item.dayDate);
    const next = recordTripVisit({
      trip,
      visitId: itemId(`visit:${tripItemId}`),
      itemId: tripItemId,
      ...(item.destinationNodeId ? { destinationNodeId: item.destinationNodeId } : {}),
      dayDate: item.dayDate,
      visitedAt: at,
      title: item.title,
      kind: item.kind,
      evidence: 'user-confirmed',
      updatedAt: new Date().toISOString()
    });
    await persistVisitorAction(next, 'visit');
  };

  if (!trip) {
    return (
      <View style={styles.root} pointerEvents={storageBusy || Boolean(archiveError) ? 'none' : 'auto'}>
        <Text style={styles.kicker}>{tr(language, 'МОЯ ПОЕЗДКА', 'MY TRIP', '我的行程')}</Text>
        <Text style={styles.title}>
          {tr(
            language,
            'Соберите Москву по дням',
            'Build Moscow day by day',
            '按天规划莫斯科行程'
          )}
        </Text>
        <Text style={styles.body}>
          {tr(
            language,
            'Добавляйте места, рестораны, театры, события и уже купленные билеты. После визита они останутся в вашей истории Москвы.',
            'Add places, restaurants, theatres, events and tickets you already bought. After the visit they remain in your Moscow history.',
            '添加景点、餐厅、剧院、活动和已购买的门票。到访后，它们会保留在你的莫斯科足迹中。'
          )}
        </Text>

        {selectedDirectoryPlace && <Text style={styles.body}>{tr(language,'После создания поездки подтвердите добавление: ','After creating a trip, confirm this place: ','创建行程后确认添加：') + selectedDirectoryPlace.titleRu}</Text>}
        <Text style={styles.label}>{tr(language, 'ДАТА ПРИЕЗДА', 'ARRIVAL DATE', '抵达日期')}</Text>
        <TextInput
          value={startDateInput}
          onChangeText={setStartDateInput}
          placeholder="2026-10-02"
          placeholderTextColor="#666d75"
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{tr(language, 'СКОЛЬКО ДНЕЙ', 'HOW MANY DAYS', '行程天数')}</Text>
        <View style={styles.chips}>
          {durationOptions.map((days) => (
            <PhysicalPressable
              key={days}
              style={[styles.chip, durationDays === days && styles.chipActive]}
              contentStyle={styles.center}
              onPress={() => setDurationDays(days)}
            >
              <Text style={[styles.chipText, durationDays === days && styles.chipTextActive]}>{days}</Text>
            </PhysicalPressable>
          ))}
        </View>

        <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={createTrip}>
          <Text style={styles.primaryText}>{tr(language, 'Создать поездку', 'Create trip', '创建行程')}</Text>
        </PhysicalPressable>
        {recoveryNotice ? <Text style={styles.recoveryNotice}>{tr(language,
          'После прерванной операции локальная история восстановлена и проверена.',
          'Your interrupted trip operation was recovered and verified.',
          '中断的行程操作已恢复并核验。')}</Text> : null}
        {archiveError ? <Text style={styles.recoveryError}>{tr(language,
          'Локальное сохранение или восстановление не подтверждено. Изменения заблокированы. Не очищайте данные приложения; перезапустите его для повторной проверки.',
          'Trip storage or recovery could not be verified. Changes are blocked. Do not clear app data; restart to retry recovery.',
          '无法核验行程存储或恢复。编辑已阻止。请勿清除应用数据，重新启动以重试。')}</Text> : null}
        {archiveReady && !archiveError && (
          <TripArchivePanel archive={archive} language={language} onOpenArchivedTrip={(id) => { void openPreviousTrip(id); }} />
        )}
        <MoscowTravelHistoryCard activeTrip={trip} archive={archive} language={language} onOpenTrip={(id) => { void openPreviousTrip(id); }} />
      {backupPanel}
      </View>
    );
  }

  return (
    <View style={styles.root} pointerEvents={storageBusy || Boolean(archiveError) ? 'none' : 'auto'}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'МОЯ ПОЕЗДКА', 'MY TRIP', '我的行程')}</Text>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.body}>
            {trip.startDate} → {trip.endDate}
          </Text>
        </View>
        <PhysicalPressable
          style={styles.reset}
          contentStyle={styles.center}
          onPress={() => setResetConfirmationOpen(true)}
        >
          <Text style={styles.resetText}>{tr(language, 'Новая', 'New', '新行程')}</Text>
        </PhysicalPressable>
      </View>

      {recoveryNotice ? <Text style={styles.recoveryNotice}>{tr(language,
        'Прерванная операция восстановлена из проверенного локального журнала.',
        'Interrupted operation recovered from the validated local journal.',
        '已从核验的本地日志恢复中断操作。')}</Text> : null}
      {archiveError ? <Text style={styles.recoveryError}>{tr(language,
        'Сохранение не проверено или обнаружен конфликт восстановления. Изменения временно заблокированы. Не очищайте данные приложения, перезапустите его.',
        'Storage is unverified or recovery conflicted. Changes are blocked. Do not clear app data; restart.',
        '存储未验证或恢复发生冲突。编辑已阻止。请勿清除应用数据，重新启动。')}</Text> : null}
      {resetConfirmationOpen && (
        <View style={styles.dangerPanel}>
          <Text style={styles.dangerTitle}>{tr(language, 'Создать новую поездку?', 'Start a new trip?', '创建新的行程？')}</Text>
          <Text style={styles.dangerBody}>{tr(language,
            'Можно сохранить текущую поездку в архиве этого устройства или удалить её. Без облачной синхронизации история не восстановится на другом устройстве.',
            'You may archive the trip on this device or delete it. Without cloud sync, the history will not appear on another device.',
            '可在此设备存档或删除行程。没有云同步就无法在其他设备恢复。')}</Text>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Архивировать текущую поездку и начать новую', 'Archive current trip and start a new one', '存档当前行程并开始新行程')}
            style={styles.archiveButton}
            contentStyle={styles.center}
            disabled={!archiveReady || Boolean(archiveError)}
            onPress={() => { void archiveAndCreateNew(); }}
          ><Text style={styles.archiveButtonText}>{tr(language, 'Сохранить в архив и начать новую', 'Archive and start new', '存档并开始新行程')}</Text></PhysicalPressable>
          <Text style={styles.dangerBody}>{tr(language,
            'Удаление ниже удалит активную версию с этого устройства. Ранее архивированные версии останутся в истории.',
            'Deleting below removes the active copy on this device. Previously archived versions remain in history.',
            '删除将移除本设备上的当前副本，已有存档仍会保留。')}</Text>
          {formError.startsWith('trip-archive-') || formError.startsWith('archived-trip-') ? (
            <Text style={styles.dangerBody}>{tr(language,
              'Не удалось сохранить или восстановить историю. Проверьте свободное место и повторите действие — текущая поездка пока сохранена.',
              'Could not save or restore history. Check local storage and retry; the active trip is still preserved.',
              '无法保存或恢复行程历史。请检查存储空间后重试；当前行程仍被保留。')}</Text>
          ) : null}
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Удалить текущую поездку и начать новую', 'Delete current trip and start a new one', '删除当前行程并重新开始')}
            style={styles.dangerButton}
            contentStyle={styles.center}
            onPress={() => { void deleteActiveTrip(); }}
          ><Text style={styles.dangerButtonText}>{tr(language, 'Удалить поездку', 'Delete trip', '删除行程')}</Text></PhysicalPressable>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Удалить все локальные версии текущей поездки', 'Delete all local copies of this trip', '删除该行程的所有本地副本')}
            style={styles.dangerButton} contentStyle={styles.center}
            onPress={() => setEraseAllCopiesConfirm(true)}
          ><Text style={styles.dangerButtonText}>{tr(language, 'Удалить полностью с устройства', 'Delete all local copies', '删除全部本地副本')}</Text></PhysicalPressable>
          {eraseAllCopiesConfirm ? (
            <View style={styles.dangerPanel}>
              <Text style={styles.dangerBody}>{tr(language,
                'Будут удалены активная поездка и все её архивные версии на этом устройстве. Другие поездки останутся. Экспортированные файлы и копии на других устройствах НЕ удаляются.',
                'The active trip and every archived copy of it on this device will be deleted. Other trips stay. Exported files and copies on other devices are NOT deleted.',
                '将删除本机该行程的活动与存档副本；其他行程保留。已导出的文件和其他设备副本不会删除。')}</Text>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language, 'Окончательно удалить все местные копии этой поездки', 'Confirm delete every local copy of this trip', '确认删除本地全部副本')}
                style={styles.dangerButton} contentStyle={styles.center}
                onPress={() => { void eraseAllLocalTripCopies(); }}
              ><Text style={styles.dangerButtonText}>{tr(language, 'Подтвердить полное удаление', 'Confirm full deletion', '确认完全删除')}</Text></PhysicalPressable>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language, 'Отмена полного удаления', 'Cancel full deletion', '取消完全删除')}
                style={styles.reset} contentStyle={styles.center}
                onPress={() => setEraseAllCopiesConfirm(false)}
              ><Text style={styles.resetText}>{tr(language, 'Не удалять', 'Keep trip', '保留行程')}</Text></PhysicalPressable>
            </View>
          ) : null}
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Отменить удаление поездки', 'Keep current trip', '保留当前行程')}
            style={styles.reset}
            contentStyle={styles.center}
            onPress={() => setResetConfirmationOpen(false)}
          ><Text style={styles.resetText}>{tr(language, 'Сохранить мою поездку', 'Keep my trip', '保留行程')}</Text></PhysicalPressable>
        </View>
      )}
      {selectedDirectoryPlace && <View style={styles.directoryConfirm}>
        <Text style={styles.directoryTitle}>{tr(language,'Добавить в выбранный день?','Add to selected day?','添加到选定日期？')}</Text>
        <Text style={styles.directoryBody}>{language === 'ru' ? selectedDirectoryPlace.titleRu : selectedDirectoryPlace.titleEn} · {selectedDirectoryPlace.addressRu}</Text>
        <Text style={styles.directoryBody}>{tr(language,'Выбранный день','Selected day','选择的日期')}: {selectedDay}</Text>
        <Text style={styles.directoryBody}>{tr(language,'Это место, не билет и не бронь. Время и часы работы не проверены.','A saved place, not a ticket or reservation. Hours and times are unverified.','只是保存地点，不代表已购票或预订。')}</Text>
        {formError ? <Text style={styles.directoryError}>{formError}</Text> : null}
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Подтвердить добавление места','Confirm add place','确认添加地点')} style={styles.primary} contentStyle={styles.center} disabled={storageBusy} onPress={() => { void addDirectoryPlace(); }}>
          <Text style={styles.primaryText}>{tr(language,'Добавить в день','Add to day','添加到当天')}</Text>
        </PhysicalPressable>
        <VenueServiceIntakeCard
          key={selectedDirectoryPlace.id + ':' + selectedDay}
          place={selectedDirectoryPlace}
          trip={trip}
          dayDate={selectedDay}
          language={language}
          busy={storageBusy || Boolean(archiveError)}
          onPersist={(next) => persistVisitorAction(next, 'directory')}
          onSaved={() => onDirectoryPlaceHandled?.()}
        />
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Отменить выбор места','Cancel place selection','取消选点')} style={styles.reset} contentStyle={styles.center} onPress={onDirectoryPlaceHandled}>
          <Text style={styles.resetText}>{tr(language,'Отмена','Cancel','取消')}</Text>
        </PhysicalPressable>
      </View>}
      {historyError ? <Text testID="trip-history-save-error" style={styles.recoveryError}>{historyError}</Text> : null}
      <TouristTodayCard
        trip={trip}
        language={language}
        visitedIds={knownVisitedNodeIds}
        onOpenPlace={onOpenPlace}
        onDiscover={onDiscover}
        onMarkVisited={markVisited}
        onManageTrip={() => setTripToolsOpen(true)}
      />

      {summary && (
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricValue}>{summary.dayCount}</Text><Text style={styles.metricLabel}>{tr(language, 'дней', 'days', '天')}</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{summary.commitmentCount}</Text><Text style={styles.metricLabel}>{tr(language, 'броней', 'bookings', '预订')}</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{summary.visitedCount}</Text><Text style={styles.metricLabel}>{tr(language, 'посещено', 'visited', '已到访')}</Text></View>
        </View>
      )}

      <TripReadinessCard
        trip={trip}
        dayDate={selectedDay}
        language={language}
        onManageBooking={(itemId) => {
          setBookingHelpItemId(itemId);
          setBookingHelpAfterReadiness(true);
          setBookingHelpOpen(true);
        }}
        onOpenTripDetails={() => setTripToolsOpen(true)}
      />

      {bookingHelpAfterReadiness && <BookingResolutionCard
        trip={trip}
        language={language}
        open={bookingHelpOpen}
        focusedItemId={bookingHelpItemId}
        onToggle={setBookingHelpOpen}
        onUpdate={(next) => persistVisitorAction(next, 'booking')}
      />}

      <TripJourneyOverview trip={trip} dayDate={selectedDay} language={language} onVisit={markVisited} onOpenDetails={() => setTripToolsOpen((v) => !v)} />

      <TripFinanceCard
        trip={trip}
        dayDate={selectedDay}
        language={language}
        onUpdate={(next) => persistVisitorAction(next, 'finance')}
        onRefreshStoredTrip={refreshStoredTripForFinance}
      />

      {walkVisitCandidates.length > 0 ? (
        <View testID="walk-visit-candidates" style={styles.form}>
          <Text style={styles.formTitle}>{tr(language,
            'В прогулке отмечены места — подтвердите посещение для дневника',
            'Places marked in your walk — confirm before recording in your diary',
            '步行记录中有地点，请先确认实际到访')}</Text>
          <Text style={styles.truthNote}>{tr(language,
            'Прежние отметки прогулок не содержат дату и не подтверждают посещение именно в этой поездке.',
            'Existing walk progress has no visit date and is not proof of this trip.',
            '过往步行记录没有到访日期，不能证明本次行程已到访。')}</Text>
          {walkVisitCandidates.map(candidate => (
            <PhysicalPressable key={candidate.itemId} accessibilityRole="button"
              accessibilityLabel={tr(language, 'Подтвердить посещение из прогулки: ',
                'Confirm walk visit: ', '确认步行到访：') + candidate.title}
              style={styles.secondary} contentStyle={styles.center}
              onPress={() => { void markVisited(candidate.itemId).catch(() => undefined); }}>
              <Text style={styles.secondaryText}>{candidate.title} · {tr(language,
                'Да, я посетил', 'Yes, I visited', '是的，我到访了')}</Text>
            </PhysicalPressable>
          ))}
        </View>
      ) : null}
      <TripAcceptanceHistoryCard trip={trip} language={language} />
      {archiveReady && !archiveError && (
        <TripArchivePanel archive={archive} activeTripId={trip.id} language={language} onOpenArchivedTrip={(id) => { void openPreviousTrip(id); }} />
      )}
      <MoscowTravelHistoryCard activeTrip={trip} archive={archive} language={language} onOpenTrip={(id) => { void openPreviousTrip(id); }} />
      {backupPanel}

      {tripToolsOpen && <TripPreferencesCard
        trip={trip}
        language={language}
        onUpdate={(next) => persistVisitorAction(next, 'preferences')}
      />}



      <BookingWalletCard
        trip={trip}
        language={language}
        onManageBooking={(itemId) => {
          setBookingHelpItemId(itemId);
          setBookingHelpAfterReadiness(false);
          setBookingHelpOpen(true);
        }}
      />
      <CalendarInviteImportCard trip={trip} language={language} onUpdate={persistCalendarImport} />
      {!bookingHelpAfterReadiness && <BookingResolutionCard
        trip={trip}
        language={language}
        open={bookingHelpOpen}
        focusedItemId={bookingHelpItemId}
        onToggle={setBookingHelpOpen}
        onUpdate={(next) => persistVisitorAction(next, 'booking')}
      />}

      <LiveDisruptionCard
        disruptions={liveDisruptions}
        language={language}
      />

      <ReplacementProposalCard
        sets={replacementProposalSets}
        language={language}
        onAccept={acceptReplacement}
        onVerifyRouting={verifyReplacementRouting}
        verifyingProposalId={verifyingProposalId}
        actionError={replacementActionError}
      />

      {tripToolsOpen && <DayReplanCard
        trip={trip}
        dayDate={selectedDay}
        language={language}
        onUpdate={(next) => persistVisitorAction(next, 'replan')}
      />}

      <Text style={styles.label}>{tr(language, 'ДНИ ПОЕЗДКИ', 'TRIP DAYS', '行程日期')}</Text>
      <View style={styles.dayChips}>
        {trip.days.map((day, index) => (
          <PhysicalPressable
            key={day}
            style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
            contentStyle={styles.center}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayNumber, selectedDay === day && styles.dayNumberActive]}>
              {tr(language, `День ${index + 1}`, `Day ${index + 1}`, `第${index + 1}天`)}
            </Text>
            <Text style={[styles.dayDate, selectedDay === day && styles.dayDateActive]}>{shortDay(language, day)}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <MoscowNextDiscoveriesCard
        trip={trip}
        archive={archive}
        archiveReady={archiveReady && !archiveError}
        dayDate={selectedDay}
        language={language}
        onAddPlace={addSuggestedPlace}
        addError={discoveryActionError}
      />

      {dayComposer && (
        <DayComposerCard
          projection={dayComposer}
          language={language}
          onAddPreset={openAddPreset}
        />
      )}

      <View style={styles.sectionTop}>
        <View>
          <Text style={styles.kicker}>{tr(language, 'ДЕТАЛИ ДНЯ', 'DAY DETAILS', '当天详情')}</Text>
          <Text style={styles.sectionTitle}>{shortDay(language, selectedDay)}</Text>
        </View>
        <PhysicalPressable style={styles.smallPrimary} contentStyle={styles.center} onPress={() => setManualOpen((value) => !value)}>
          <Text style={styles.smallPrimaryText}>{manualOpen ? '×' : '+'} {tr(language, 'Добавить', 'Add', '添加')}</Text>
        </PhysicalPressable>
      </View>

      {manualOpen && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{tr(language, 'Добавить своё', 'Add your own', '添加自定义项目')}</Text>
          <TextInput
            value={manualTitle}
            onChangeText={setManualTitle}
            placeholder={tr(language, 'Например: Большой театр', 'For example: Bolshoi Theatre', '例如：莫斯科大剧院')}
            placeholderTextColor="#626972"
            style={styles.input}
          />

          <Text style={styles.label}>{tr(language, 'ТИП', 'TYPE', '类型')}</Text>
          <View style={styles.wrapChips}>
            {manualKinds.map((kind) => (
              <PhysicalPressable
                key={kind}
                style={[styles.kindChip, manualKind === kind && styles.kindChipActive]}
                contentStyle={styles.center}
                onPress={() => setManualKind(kind)}
              >
                <Text style={[styles.kindText, manualKind === kind && styles.kindTextActive]}>
                  {kindLabels[language][kind] ?? kind}
                </Text>
              </PhysicalPressable>
            ))}
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.field}>
              <Text style={styles.label}>{tr(language, 'ВРЕМЯ', 'TIME', '时间')}</Text>
              <TextInput
                value={manualTime}
                onChangeText={setManualTime}
                placeholder="19:00"
                placeholderTextColor="#626972"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{tr(language, 'ДО', 'UNTIL', '结束')}</Text>
              <TextInput
                value={manualEndTime}
                onChangeText={setManualEndTime}
                placeholder="21:00"
                placeholderTextColor="#626972"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.truthNote}>{tr(language,
            'Время московское. Если окончание раньше начала, событие закончится на следующий день. Одинаковое время недопустимо.',
            'Times are in Moscow. An earlier end time means the next day. Equal start and end times are not allowed.',
            '使用莫斯科时间。结束时间早于开始时间表示次日结束；两者不能相同。')}</Text>
          <Text style={styles.label}>{tr(language, 'УЖЕ ЕСТЬ', 'ALREADY HAVE', '已有')}</Text>
          <View style={styles.chips}>
            {(['none', 'ticket', 'reservation'] as CommitmentChoice[]).map((choice) => (
              <PhysicalPressable
                key={choice}
                style={[styles.commitChip, commitmentChoice === choice && styles.commitChipActive]}
                contentStyle={styles.center}
                onPress={() => setCommitmentChoice(choice)}
              >
                <Text style={[styles.commitText, commitmentChoice === choice && styles.commitTextActive]}>
                  {choice === 'none'
                    ? tr(language, 'Нет', 'None', '无')
                    : choice === 'ticket'
                      ? tr(language, 'Билет', 'Ticket', '门票')
                      : tr(language, 'Бронь', 'Reservation', '预订')}
                </Text>
              </PhysicalPressable>
            ))}
          </View>

          {commitmentChoice !== 'none' && (
            <>
              <Text style={styles.truthNote}>
                {tr(
                  language,
                  'Сохраняется как указанное вами подтверждение, а не как проверка провайдера.',
                  'Saved as a confirmation declared by you, not as provider verification.',
                  '将保存为你自行填写的确认信息，并非平台已验证的供应商凭证。'
                )}
              </Text>
              <TextInput
                value={manualProvider}
                onChangeText={setManualProvider}
                placeholder={tr(language, 'Где куплено / забронировано', 'Where it was booked / bought', '购买 / 预订平台')}
                placeholderTextColor="#626972"
                style={styles.input}
              />
              <TextInput
                value={manualReference}
                onChangeText={setManualReference}
                placeholder={tr(language, 'Номер заказа / заметка (необязательно)', 'Order reference / note (optional)', '订单号 / 备注（可选）')}
                placeholderTextColor="#626972"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualPartySize}
                onChangeText={setManualPartySize}
                placeholder={tr(language, 'Количество гостей / билетов', 'Party size / ticket count', '人数 / 门票数量')}
                placeholderTextColor="#626972"
                keyboardType="number-pad"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualSeats}
                onChangeText={setManualSeats}
                placeholder={tr(language, 'Сектор, ряд, места', 'Section, row, seats', '区域、排、座位')}
                placeholderTextColor="#626972"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualAddress}
                onChangeText={setManualAddress}
                placeholder={tr(language, 'Адрес / место встречи', 'Address / meeting point', '地址 / 集合地点')}
                placeholderTextColor="#626972"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualExternalUrl}
                onChangeText={setManualExternalUrl}
                placeholder={tr(language, 'https:// ссылка на билет / бронь', 'https:// ticket / reservation link', 'https:// 门票 / 预订链接')}
                placeholderTextColor="#626972"
                autoCapitalize="none"
                style={[styles.input, styles.inputSpaced]}
              />
            </>
          )}

          {formError ? (
            <Text style={styles.formError}>
              {formError.includes('HTTPS')
                ? tr(language, 'Ссылка должна начинаться с https://', 'The link must start with https://', '链接必须以 https:// 开头')
                : tr(language, 'Проверьте время и данные пункта', 'Check the time and item details', '请检查时间和项目详情')}
            </Text>
          ) : null}
          <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={() => { void addManual(); }}>
            <Text style={styles.primaryText}>{tr(language, 'Добавить в день', 'Add to day', '添加到当天')}</Text>
          </PhysicalPressable>
        </View>
      )}

      {activeItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{tr(language, 'День пока свободен', 'This day is still open', '这一天尚未安排')}</Text>
          <Text style={styles.emptyBody}>
            {tr(
              language,
              'Добавьте сохранённое место или внесите билет/бронь, которые у вас уже есть.',
              'Add a saved place or enter a ticket/reservation you already have.',
              '添加收藏地点，或录入你已有的门票/预订。'
            )}
          </Text>
        </View>
      ) : activeItems.map((item) => {
        const visited = visitByItemId.has(item.id);
        return (
          <View key={item.id} style={[styles.timelineItem, visited && styles.timelineItemDone]}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineMarkerText}>{visited ? '✓' : timeLabel(item.plannedStartAt) || '•'}</Text>
            </View>
            <View style={styles.timelineCopy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                {(kindLabels[language][item.kind] ?? item.kind)}
                {item.plannedStartAt ? ` · ${timeLabel(item.plannedStartAt)}${item.plannedEndAt ? `–${timeLabel(item.plannedEndAt)}` : ''}` : ''}
                {item.commitment
                  ? ` · ${item.commitment.kind === 'ticket' ? tr(language, 'билет', 'ticket', '门票') : tr(language, 'бронь', 'reservation', '预订')}`
                  : ''}
              </Text>
              {item.commitment?.provider || item.commitment?.reference ? (
                <Text style={styles.commitmentProvider}>
                  {item.commitment.provider ? `${tr(language, 'Источник', 'Source', '来源')}: ${item.commitment.provider}` : ''}
                  {item.commitment.reference ? `${item.commitment.provider ? ' · ' : ''}${item.commitment.reference}` : ''}
                </Text>
              ) : null}
              {item.plannedPartySize ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Планируемых участников', 'Planned participants', '计划参与人数')}: {item.plannedPartySize}
                </Text>
              ) : null}
              {item.commitment?.partySize ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Гостей / билетов', 'Guests / tickets', '人数 / 门票')}: {item.commitment.partySize}
                </Text>
              ) : null}
              {item.commitment?.seats ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Места', 'Seats', '座位')}: {item.commitment.seats}
                </Text>
              ) : null}
              {item.commitment?.address ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Адрес', 'Address', '地址')}: {item.commitment.address}
                </Text>
              ) : null}
              {item.commitment && (
                <>
                  <Text style={styles.commitmentStatus}>
                    {item.status === 'cancelled' || item.commitment.status === 'cancelled'
                      ? tr(language, 'Отменено — сохранено в истории', 'Cancelled — retained in history', '已取消，记录保留')
                      : item.commitment.status === 'held'
                        ? tr(language, 'Предварительная бронь · подтверждение не проверено', 'Provisional hold · not verified', '临时保留，尚未核验')
                        : item.commitment.verification === 'provider-confirmed'
                          ? tr(language, 'В записи указано подтверждение поставщика · не перепроверено', 'Provider confirmation recorded · not reverified', '记录供应商确认，尚未复核')
                          : tr(language, 'Добавлено вами · не проверено провайдером', 'Added by you · not provider verified', '由你添加 · 未经供应商验证')}
                  </Text>
                  <Text style={styles.commitmentDetail}>
                    {tr(language,
                      'Дата и время билета или брони не меняются при переносе маршрута. Изменение оформляется у поставщика.',
                      'Moving the itinerary does not change a ticket or reservation. Confirm changes with the supplier.',
                      '调整行程不会更改门票或预订，请与供应商确认变更。')}
                  </Text>
                </>
              )}
              <View style={styles.itemActions}>
                {!visited && item.commitment?.status !== 'confirmed' && activeItems.length > 1 && (
                  <>
                    <PhysicalPressable
                      style={styles.iconButton}
                      contentStyle={styles.center}
                      disabled={activeItems[0]?.id === item.id}
                      accessibilityLabel={tr(language, `Переместить ${item.title} выше`, `Move ${item.title} up`, `将 ${item.title} 上移`)}
                      onPress={() => { void reorderItem(item.id, -1); }}
                    >
                      <Text style={styles.iconButtonText}>↑</Text>
                    </PhysicalPressable>
                    <PhysicalPressable
                      style={styles.iconButton}
                      contentStyle={styles.center}
                      disabled={activeItems[activeItems.length - 1]?.id === item.id}
                      accessibilityLabel={tr(language, `Переместить ${item.title} ниже`, `Move ${item.title} down`, `将 ${item.title} 下移`)}
                      onPress={() => { void reorderItem(item.id, 1); }}
                    >
                      <Text style={styles.iconButtonText}>↓</Text>
                    </PhysicalPressable>
                  </>
                )}
                {!visited && canMoveTripStopBetweenDays(item) && trip.days.indexOf(item.dayDate) > 0 && (
                  <PhysicalPressable
                    style={styles.iconButton}
                    contentStyle={styles.center}
                    accessibilityLabel={tr(language, `Перенести ${item.title} на предыдущий день`, `Move ${item.title} to previous day`, `将 ${item.title} 移到前一天`)}
                    onPress={() => { void moveItemToAdjacentDay(item.id, -1); }}
                  >
                    <Text style={styles.iconButtonText}>←</Text>
                  </PhysicalPressable>
                )}
                {!visited && canMoveTripStopBetweenDays(item) && trip.days.indexOf(item.dayDate) < trip.days.length - 1 && (
                  <PhysicalPressable
                    style={styles.iconButton}
                    contentStyle={styles.center}
                    accessibilityLabel={tr(language, `Перенести ${item.title} на следующий день`, `Move ${item.title} to next day`, `将 ${item.title} 移到后一天`)}
                    onPress={() => { void moveItemToAdjacentDay(item.id, 1); }}
                  >
                    <Text style={styles.iconButtonText}>→</Text>
                  </PhysicalPressable>
                )}
                {item.commitment?.externalUrl && (
                  <PhysicalPressable
                    style={styles.textButton}
                    contentStyle={styles.center}
                    onPress={() => { void Linking.openURL(item.commitment!.externalUrl!); }}
                  >
                    <Text style={styles.textButtonText}>{tr(language, 'Билет / бронь', 'Ticket / booking', '门票 / 预订')}</Text>
                  </PhysicalPressable>
                )}
                {item.destinationNodeId && (
                  <PhysicalPressable
                    style={styles.textButton}
                    contentStyle={styles.center}
                    onPress={() => onOpenPlace(item.destinationNodeId!)}
                  >
                    <Text style={styles.textButtonText}>{tr(language, 'Открыть', 'Open', '打开')}</Text>
                  </PhysicalPressable>
                )}
                {!visited && (
                  <PhysicalPressable style={styles.visitButton} contentStyle={styles.center} onPress={() => { void markVisited(item.id).catch(() => undefined); }}>
                    <Text style={styles.visitButtonText}>{tr(language, 'Я был здесь', 'I was here', '我来过这里')}</Text>
                  </PhysicalPressable>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {savedNodes.length > 0 && (
        <>
          <Text style={styles.label}>{tr(language, 'ИЗ СОХРАНЁННОГО', 'FROM SAVED', '从收藏中添加')}</Text>
          <View style={styles.quickList}>
            {savedNodes.slice(0, 5).map((node) => {
              const added = trip.items.some((item) => item.destinationNodeId === node.id && item.dayDate === selectedDay);
              return (
                <View key={node.id} style={styles.quickRow}>
                  <View style={styles.quickCopy}>
                    <Text style={styles.quickTitle}>{nodeTitle(language, node)}</Text>
                    <Text style={styles.quickMeta}>{node.kind}</Text>
                  </View>
                  <PhysicalPressable
                    style={[styles.addButton, added && styles.disabled]}
                    contentStyle={styles.center}
                    disabled={added}
                    onPress={() => { void addNode(node.id); }}
                  >
                    <Text style={styles.addButtonText}>{added ? '✓' : '+'}</Text>
                  </PhysicalPressable>
                </View>
              );
            })}
          </View>
        </>
      )}

      {unseen.length > 0 && (
        <>
          <View style={styles.sectionTop}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.kicker}>{tr(language, 'ЧТО ЕЩЁ УВИДЕТЬ', 'WHAT ELSE TO SEE', '还可以去哪里')}</Text>
              <Text testID="trip-unseen-heading" style={styles.sectionTitle}>{tr(language, 'Нет в плане и известных записях посещений', 'Not in plan or identified visit records', '未列入计划或已识别到访记录')}</Text>
            </View>
          </View>
          <View style={styles.quickList}>
            {unseen.slice(0, 4).map((node) => (
              <View key={node.id} style={styles.quickRow}>
                <PhysicalPressable style={styles.quickCopy} contentStyle={styles.quickCopyContent} onPress={() => onOpenPlace(node.id)}>
                  <Text style={styles.quickTitle}>{nodeTitle(language, node)}</Text>
                  <Text style={styles.quickMeta}>{tr(language, 'Из исторического справочника · часы работы не проверены', 'From the heritage directory · hours unverified', '来自历史地点目录 · 开放时间未核验')}</Text>
                </PhysicalPressable>
                <PhysicalPressable style={styles.addButton} contentStyle={styles.center} onPress={() => { void addNode(node.id); }}>
                  <Text style={styles.addButtonText}>+</Text>
                </PhysicalPressable>
              </View>
            ))}
          </View>
        </>
      )}

      <MoscowPassportCard trip={trip} language={language} onSaveVisitNote={async (visitId, note) => {
        const next = updateTripVisitNote({ trip, visitId, note, updatedAt: new Date().toISOString() });
        await persistVisitorAction(next, 'note');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  dangerPanel: { padding: 17, backgroundColor: '#392c29', borderWidth: 1, borderColor: '#916157', borderRadius: 18, marginVertical: 12, gap: 9 },
  archiveButton: { borderRadius: 12, minHeight: 49, backgroundColor: '#e7d8b4' },
  archiveButtonText: { color: '#284131', fontSize: 13, fontWeight: '700' },
  dangerTitle: { color: '#fff3e8', fontSize: 19, fontWeight: '700' },
  dangerBody: { color: '#f5d7ce', fontSize: 13, lineHeight: 20 },
  dangerButton: { minHeight: 48, backgroundColor: '#8b463b', borderRadius: 12 },
  dangerButtonText: { color: '#fff7f2', fontWeight: '700', fontSize: 13 },
  directoryError: { color: '#f6ba9f', fontSize: 12, lineHeight: 18, marginTop: 6 },
  directoryConfirm: { borderWidth: 1, borderColor: '#8b9e80', borderRadius: 20, padding: 16, marginVertical: 12, backgroundColor: '#293c30' },
  directoryTitle: { color: '#fff3e0', fontSize: 20, fontWeight: '700' },
  directoryBody: { color: '#d7e4d4', fontSize: 13, lineHeight: 20, marginTop: 8 },
  root: { borderRadius: 26, borderWidth: 1, borderColor: '#343a42', backgroundColor: '#101318', padding: 18, marginBottom: 24 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.35, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 5 },
  body: { color: '#9da2aa', fontSize: 12, lineHeight: 18, marginTop: 6 },
  label: { color: '#737a83', fontSize: 8, letterSpacing: 1.15, fontWeight: '900', marginTop: 16, marginBottom: 7 },
  input: { minHeight: 47, borderRadius: 14, borderWidth: 1, borderColor: '#363c44', backgroundColor: '#171b20', color: '#f2eee5', paddingHorizontal: 13, fontSize: 13 },
  inputSpaced: { marginTop: 7 },
  formError: { color: '#dc9e94', fontSize: 9, lineHeight: 14, marginTop: 8 },
  recoveryNotice: { borderWidth: 1, borderColor: '#63866a', backgroundColor: '#24382c', borderRadius: 12, padding: 12, marginTop: 10, color: '#cce6d1', fontSize: 13, lineHeight: 19 },
  recoveryError: { borderWidth: 1, borderColor: '#bd8479', backgroundColor: '#3a2627', borderRadius: 12, padding: 12, marginTop: 10, color: '#ffcdc3', fontSize: 13, lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 7 },
  chip: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#3b424a' },
  chipActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  chipText: { color: '#aeb3ba', fontSize: 11, fontWeight: '900' },
  chipTextActive: { color: '#17130d' },
  primary: { minHeight: 50, borderRadius: 15, backgroundColor: '#d7bb84', marginTop: 14 },
  primaryText: { color: '#17130d', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingCopy: { flex: 1, minWidth: 0 },
  reset: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#3c424a', paddingHorizontal: 10 },
  resetText: { color: '#ad9a77', fontSize: 9, fontWeight: '900' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 15 },
  metric: { flex: 1, borderRadius: 15, backgroundColor: '#181c22', padding: 12 },
  metricValue: { color: '#e3c486', fontSize: 21, fontWeight: '900' },
  metricLabel: { color: '#777e87', fontSize: 9, marginTop: 3 },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dayChip: { minWidth: 88, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: '#353b43', paddingHorizontal: 10 },
  dayChipActive: { borderColor: '#ad915f', backgroundColor: '#211b13' },
  dayNumber: { color: '#777e87', fontSize: 8, fontWeight: '900' },
  dayNumberActive: { color: '#d9ba7e' },
  dayDate: { color: '#bec2c8', fontSize: 10, fontWeight: '800', marginTop: 2 },
  dayDateActive: { color: '#f3dfb6' },
  sectionTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 20, marginBottom: 9 },
  // An intrinsic-width flex row child otherwise clips this long heading.
  sectionHeadingCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: '#ece8df', fontSize: 16, lineHeight: 22, fontWeight: '900', marginTop: 4, flexShrink: 1, flexWrap: 'wrap' },
  smallPrimary: { minHeight: 38, borderRadius: 12, backgroundColor: '#262017', paddingHorizontal: 10, borderWidth: 1, borderColor: '#6d5a39' },
  smallPrimaryText: { color: '#e1c184', fontSize: 9, fontWeight: '900' },
  form: { borderRadius: 18, backgroundColor: '#15191e', borderWidth: 1, borderColor: '#30363e', padding: 14, marginBottom: 12 },
  formTitle: { color: '#f0ece4', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  secondary: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#90784e', marginTop: 6 },
  secondaryText: { color: '#e5c88e', fontSize: 13, fontWeight: '700' },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kindChip: { minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: '#343b43', paddingHorizontal: 9 },
  kindChipActive: { borderColor: '#90784e', backgroundColor: '#241e15' },
  kindText: { color: '#9298a0', fontSize: 9, fontWeight: '800' },
  kindTextActive: { color: '#e1c486' },
  inlineFields: { flexDirection: 'row', gap: 8 },
  field: { flex: 1 },
  commitChip: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: '#383e46' },
  commitChipActive: { borderColor: '#a48858', backgroundColor: '#211b13' },
  commitText: { color: '#9da2aa', fontSize: 9, fontWeight: '900' },
  commitTextActive: { color: '#e5c88e' },
  truthNote: { color: '#8b929a', fontSize: 9, lineHeight: 14, marginVertical: 8 },
  empty: { borderRadius: 17, backgroundColor: '#171b20', padding: 15, marginBottom: 10 },
  emptyTitle: { color: '#ede8df', fontSize: 14, fontWeight: '900' },
  emptyBody: { color: '#858c94', fontSize: 10, lineHeight: 15, marginTop: 4 },
  timelineItem: { flexDirection: 'row', gap: 10, borderRadius: 17, backgroundColor: '#171b20', borderWidth: 1, borderColor: '#292f36', padding: 13, marginBottom: 8 },
  timelineItemDone: { borderColor: '#3e5f49' },
  timelineMarker: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#22272e' },
  timelineMarkerText: { color: '#d8b97d', fontSize: 10, fontWeight: '900' },
  timelineCopy: { flex: 1, minWidth: 0 },
  itemTitle: { color: '#f1ede5', fontSize: 14, fontWeight: '900' },
  itemMeta: { color: '#969ca4', fontSize: 9, marginTop: 3 },
  commitmentProvider: { color: '#9ea5ad', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  commitmentDetail: { color: '#858d95', fontSize: 8.5, lineHeight: 12, marginTop: 2 },
  commitmentStatus: { color: '#b69a67', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  iconButton: { width: 34, minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#3b4149' },
  iconButtonText: { color: '#c7b58e', fontSize: 13, fontWeight: '900' },
  textButton: { minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#3b4149', paddingHorizontal: 9 },
  textButtonText: { color: '#c5b28c', fontSize: 8.5, fontWeight: '900' },
  visitButton: { minHeight: 34, borderRadius: 11, backgroundColor: '#d3b578', paddingHorizontal: 10 },
  visitButtonText: { color: '#17130d', fontSize: 8.5, fontWeight: '900' },
  quickList: { gap: 7 },
  quickRow: { minHeight: 58, borderRadius: 15, backgroundColor: '#171b20', flexDirection: 'row', alignItems: 'center', padding: 10 },
  quickCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  quickCopyContent: { alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 0 },
  quickTitle: { color: '#ede9e1', fontSize: 12, fontWeight: '900' },
  quickMeta: { color: '#7e858e', fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  addButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#282116' },
  addButtonText: { color: '#e2c283', fontSize: 18, fontWeight: '900' },
  disabled: { opacity: 0.42 },
  conflictBox: { borderRadius: 15, borderWidth: 1, borderColor: '#754f47', backgroundColor: '#241716', padding: 12, marginBottom: 10 },
  conflictTitle: { color: '#e3a99e', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  conflictText: { color: '#c8a39c', fontSize: 9, lineHeight: 14, marginTop: 5 },
  freeWindows: { gap: 6 },
  freeWindow: { borderRadius: 13, borderWidth: 1, borderColor: '#313941', backgroundColor: '#151a1f', padding: 10 },
  freeWindowTime: { color: '#d5bd8d', fontSize: 11, fontWeight: '900' },
  freeWindowMeta: { color: '#79818a', fontSize: 8.5, marginTop: 3 }
});
