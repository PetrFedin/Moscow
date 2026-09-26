export type DestinationScope = 'city' | 'region' | 'route-cluster';

export type DestinationSourceRights =
  | 'public-domain'
  | 'official-reference'
  | 'licensed'
  | 'partner-provided'
  | 'review-required';

export type ExperienceNodeKind =
  | 'heritage'
  | 'museum'
  | 'food'
  | 'event'
  | 'activity'
  | 'nature'
  | 'stay'
  | 'transport'
  | 'viewpoint';

export type BookingMode =
  | 'none'
  | 'external-provider'
  | 'partner-deep-link'
  | 'city-service';

export type DestinationSource = {
  id: string;
  owner: string;
  title: string;
  url: string;
  accessedAt: string;
  rights: DestinationSourceRights;
};

export type BookingHandoff = {
  mode: Exclude<BookingMode, 'none'>;
  provider: string;
  action: 'book' | 'reserve' | 'buy-ticket' | 'request';
  url: string;
};

export type ExperienceNode = {
  id: string;
  kind: ExperienceNodeKind;
  titleRu: string;
  titleEn?: string;
  titleZh?: string;
  latitude: number;
  longitude: number;
  durationMinutes?: number;
  tags: string[];
  sourceIds: string[];
  heritagePackageId?: string;
  booking?: BookingHandoff;
};

export type DestinationRoute = {
  id: string;
  titleRu: string;
  titleEn?: string;
  titleZh?: string;
  nodeIds: string[];
  estimatedMinutes: number;
  themes: string[];
  source: 'editorial' | 'official' | 'partner';
};

export type CommercialPlacement = {
  id: string;
  sponsorName: string;
  entityIds: string[];
  surfaces: Array<'discover' | 'route' | 'event' | 'food' | 'post-trip'>;
  disclosureRu: string;
  disclosureEn?: string;
  disclosureZh?: string;
  startsAt?: string;
  endsAt?: string;
};

export type DestinationPackage = {
  schemaVersion: 1;
  id: string;
  version: number;
  destination: {
    id: string;
    scope: DestinationScope;
    titleRu: string;
    titleEn?: string;
    titleZh?: string;
    federalSubjectCode?: string;
    countryCode: 'RU';
  };
  publisher: string;
  primaryLanguage: 'ru';
  publishedAt?: string;
  languages: string[];
  sources: DestinationSource[];
  nodes: ExperienceNode[];
  routes: DestinationRoute[];
  commercialPlacements: CommercialPlacement[];
  offlineEligible: boolean;
};

export type DestinationPackageValidation = {
  valid: boolean;
  publishable: boolean;
  blockers: string[];
  publicationBlockers: string[];
  warnings: string[];
};

function duplicateIds(values: Array<{ id: string }>) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }
  return [...duplicates];
}

function isHttps(value: string) {
  return /^https:\/\//i.test(value);
}

function isCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function nonEmptyUnique(values: string[]) {
  return values.length > 0
    && new Set(values).size === values.length
    && values.every((value) => value.trim().length > 0);
}

export function validateDestinationPackage(pkg: DestinationPackage): DestinationPackageValidation {
  const blockers: string[] = [];
  const publicationBlockers: string[] = [];
  const warnings: string[] = [];

  if (pkg.schemaVersion !== 1) blockers.push('unsupported-schema-version');
  if (!pkg.id.trim()) blockers.push('package-id-missing');
  if (!Number.isInteger(pkg.version) || pkg.version < 1) blockers.push('package-version-invalid');
  if (!pkg.destination.id.trim()) blockers.push('destination-id-missing');
  if (!pkg.destination.titleRu.trim()) blockers.push('destination-title-ru-missing');
  if (pkg.destination.countryCode !== 'RU') blockers.push('country-code-must-be-ru');
  if (!pkg.publisher.trim()) blockers.push('publisher-missing');
  if (pkg.primaryLanguage !== 'ru') blockers.push('primary-language-must-be-russian');
  if (!pkg.languages.includes('ru')) blockers.push('russian-localization-missing');
  if (!pkg.languages.includes('en')) publicationBlockers.push('english-localization-missing');
  if (!pkg.languages.includes('zh')) publicationBlockers.push('chinese-localization-missing');
  if (!pkg.destination.titleEn?.trim()) publicationBlockers.push('destination-title-en-missing');
  if (!pkg.destination.titleZh?.trim()) publicationBlockers.push('destination-title-zh-missing');
  if (pkg.nodes.length === 0) blockers.push('experience-nodes-missing');

  for (const duplicate of duplicateIds(pkg.sources)) blockers.push(`duplicate-source-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.nodes)) blockers.push(`duplicate-node-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.routes)) blockers.push(`duplicate-route-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.commercialPlacements)) {
    blockers.push(`duplicate-commercial-placement-id:${duplicate}`);
  }

  const sourceIds = new Set(pkg.sources.map((source) => source.id));
  const nodeIds = new Set(pkg.nodes.map((node) => node.id));

  for (const source of pkg.sources) {
    if (!source.id.trim()) blockers.push('source-id-missing');
    if (!source.owner.trim()) blockers.push(`source-owner-missing:${source.id}`);
    if (!source.title.trim()) blockers.push(`source-title-missing:${source.id}`);
    if (!source.url.trim()) blockers.push(`source-url-missing:${source.id}`);
    else if (!isHttps(source.url)) blockers.push(`source-url-not-https:${source.id}`);
    if (!source.accessedAt.trim()) blockers.push(`source-accessed-at-missing:${source.id}`);
    if (source.rights === 'review-required') {
      publicationBlockers.push(`source-rights-review-required:${source.id}`);
    }
  }

  for (const node of pkg.nodes) {
    if (!node.id.trim()) blockers.push('node-id-missing');
    if (!node.titleRu.trim()) blockers.push(`node-title-ru-missing:${node.id}`);
    if (!node.titleEn?.trim()) publicationBlockers.push(`node-title-en-missing:${node.id}`);
    if (!node.titleZh?.trim()) publicationBlockers.push(`node-title-zh-missing:${node.id}`);
    if (!isCoordinate(node.latitude, -90, 90)) blockers.push(`node-latitude-invalid:${node.id}`);
    if (!isCoordinate(node.longitude, -180, 180)) blockers.push(`node-longitude-invalid:${node.id}`);
    if (!nonEmptyUnique(node.sourceIds)) blockers.push(`node-source-missing:${node.id}`);
    for (const sourceId of node.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`node-source-not-found:${node.id}:${sourceId}`);
    }
    if (node.durationMinutes !== undefined && (!Number.isFinite(node.durationMinutes) || node.durationMinutes <= 0)) {
      blockers.push(`node-duration-invalid:${node.id}`);
    }
    if (node.kind === 'heritage' && !node.heritagePackageId?.trim()) {
      warnings.push(`heritage-package-not-bound:${node.id}`);
    }
    if (node.booking) {
      if (!node.booking.provider.trim()) blockers.push(`booking-provider-missing:${node.id}`);
      if (!isHttps(node.booking.url)) blockers.push(`booking-url-not-https:${node.id}`);
    }
  }

  for (const route of pkg.routes) {
    if (!route.id.trim()) blockers.push('route-id-missing');
    if (!route.titleRu.trim()) blockers.push(`route-title-ru-missing:${route.id}`);
    if (!route.titleEn?.trim()) publicationBlockers.push(`route-title-en-missing:${route.id}`);
    if (!route.titleZh?.trim()) publicationBlockers.push(`route-title-zh-missing:${route.id}`);
    if (!nonEmptyUnique(route.nodeIds)) blockers.push(`route-node-list-invalid:${route.id}`);
    for (const nodeId of route.nodeIds) {
      if (!nodeIds.has(nodeId)) blockers.push(`route-node-not-found:${route.id}:${nodeId}`);
    }
    if (!Number.isFinite(route.estimatedMinutes) || route.estimatedMinutes <= 0) {
      blockers.push(`route-estimate-invalid:${route.id}`);
    }
  }

  for (const placement of pkg.commercialPlacements) {
    if (!placement.sponsorName.trim()) blockers.push(`commercial-sponsor-missing:${placement.id}`);
    if (!placement.disclosureRu.trim()) blockers.push(`commercial-disclosure-ru-missing:${placement.id}`);
    if (!placement.disclosureEn?.trim()) publicationBlockers.push(`commercial-disclosure-en-missing:${placement.id}`);
    if (!placement.disclosureZh?.trim()) publicationBlockers.push(`commercial-disclosure-zh-missing:${placement.id}`);
    if (!nonEmptyUnique(placement.entityIds)) blockers.push(`commercial-entities-invalid:${placement.id}`);
    if (placement.surfaces.length === 0) blockers.push(`commercial-surfaces-missing:${placement.id}`);
    for (const entityId of placement.entityIds) {
      if (!nodeIds.has(entityId) && !pkg.routes.some((route) => route.id === entityId)) {
        blockers.push(`commercial-entity-not-found:${placement.id}:${entityId}`);
      }
    }
    if (placement.startsAt && placement.endsAt && placement.endsAt < placement.startsAt) {
      blockers.push(`commercial-dates-invalid:${placement.id}`);
    }
  }

  if (pkg.routes.length === 0) warnings.push('routes-missing');
  if (!pkg.publishedAt?.trim()) warnings.push('published-at-missing');

  return {
    valid: blockers.length === 0,
    publishable: blockers.length === 0 && publicationBlockers.length === 0,
    blockers,
    publicationBlockers,
    warnings
  };
}

export function assertDestinationPackageCanPublish(pkg: DestinationPackage) {
  const validation = validateDestinationPackage(pkg);
  if (!validation.valid) {
    throw new Error(`Destination package is structurally invalid: ${validation.blockers.join('; ')}`);
  }
  if (!validation.publishable) {
    throw new Error(`Destination package is not publishable: ${validation.publicationBlockers.join('; ')}`);
  }
  return pkg;
}

export function getDestinationCapabilities(pkg: DestinationPackage) {
  const kinds = new Set(pkg.nodes.map((node) => node.kind));
  return {
    history: kinds.has('heritage') || kinds.has('museum'),
    food: kinds.has('food'),
    events: kinds.has('event'),
    activities: kinds.has('activity') || kinds.has('nature'),
    stays: kinds.has('stay'),
    transport: kinds.has('transport'),
    booking: pkg.nodes.some((node) => Boolean(node.booking)),
    routes: pkg.routes.length > 0,
    sponsoredPlacements: pkg.commercialPlacements.length > 0,
    offline: pkg.offlineEligible
  };
}

export function serializeDestinationPackage(pkg: DestinationPackage) {
  const validation = validateDestinationPackage(pkg);
  if (!validation.valid) {
    throw new Error(`Cannot serialize invalid destination package: ${validation.blockers.join('; ')}`);
  }
  return JSON.stringify(pkg);
}

export function parseDestinationPackage(raw: string) {
  const parsed = JSON.parse(raw) as DestinationPackage;
  const validation = validateDestinationPackage(parsed);
  if (!validation.valid) {
    throw new Error(`Destination package import failed validation: ${validation.blockers.join('; ')}`);
  }
  return parsed;
}
