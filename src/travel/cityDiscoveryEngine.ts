export type CityDiscoveryKind =
  | 'heritage'
  | 'museum'
  | 'exhibition'
  | 'theatre'
  | 'concert'
  | 'festival'
  | 'sport'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'nightlife'
  | 'park'
  | 'viewpoint'
  | 'architecture'
  | 'activity'
  | 'family'
  | 'shopping'
  | 'market'
  | 'hotel'
  | 'mobility'
  | 'seasonal'
  | 'city-programme';

export type CityDiscoveryTruth = 'demo' | 'editorial' | 'partner' | 'provider';

export type CityDiscoveryItem = {
  id: string;
  kind: CityDiscoveryKind;
  district: string;
  titleRu: string;
  titleEn: string;
  titleZh: string;
  startsAt?: string;
  endsAt?: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  tags: string[];
  truth: CityDiscoveryTruth;
  sourceRef?: string;
  availability: 'unknown' | 'available' | 'limited' | 'sold-out';
  availabilityTruth: 'demo' | 'provider' | 'unknown';
  qualityScore: number;
  sponsored?: boolean;
};

export type DiscoveryContext = {
  now: string;
  freeWindowMinutes: number;
  preferredKinds?: CityDiscoveryKind[];
  visitedIds?: string[];
  currentDistrict?: string;
  maxDistanceKm?: number;
};

export type RankedDiscoveryItem = CityDiscoveryItem & {
  startsInMinutes?: number;
  fitsWindow: boolean;
  isNew: boolean;
  organicScore: number;
};

function parseIso(value:string){
  const n=Date.parse(value);
  if(!Number.isFinite(n)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return n;
}

function clamp01(value:number){
  return Math.max(0,Math.min(1,value));
}

export function rankCityDiscovery(
  items:CityDiscoveryItem[],
  context:DiscoveryContext
){
  const now=parseIso(context.now);
  const visited=new Set(context.visitedIds ?? []);
  const preferred=new Set(context.preferredKinds ?? []);

  const ranked:RankedDiscoveryItem[]=items.map((item)=>{
    const startsInMinutes=item.startsAt
      ? Math.round((parseIso(item.startsAt)-now)/60000)
      : undefined;

    const startsSoon=startsInMinutes !== undefined && startsInMinutes >= 0 && startsInMinutes <= 120;
    const activeNow=item.startsAt && item.endsAt
      ? parseIso(item.startsAt)<=now && parseIso(item.endsAt)>=now
      : false;
    const fitsWindow=item.durationMinutes<=context.freeWindowMinutes;
    const isNew=!visited.has(item.id);

    const preferenceScore=preferred.size===0 ? 0.5 : (preferred.has(item.kind)?1:0.2);
    const noveltyScore=isNew?1:0.05;
    const quality=clamp01(item.qualityScore/5);
    const timing=activeNow?1:startsSoon?0.9:fitsWindow?0.75:0.2;
    const availability=item.availability==='sold-out'?0
      : item.availability==='limited'?0.65
      : item.availability==='available'?1
      : 0.5;

    const districtBoost=context.currentDistrict && item.district===context.currentDistrict ? 0.1 : 0;

    const organicScore=
      preferenceScore*0.28+
      noveltyScore*0.22+
      quality*0.2+
      timing*0.18+
      availability*0.12+
      districtBoost;

    return {
      ...item,
      ...(startsInMinutes!==undefined?{startsInMinutes}:{}),
      fitsWindow,
      isNew,
      organicScore:Number(organicScore.toFixed(4))
    };
  });

  const organic=ranked
    .filter(x=>!x.sponsored && x.availability!=='sold-out' && x.fitsWindow)
    .sort((a,b)=>b.organicScore-a.organicScore || a.id.localeCompare(b.id));

  const sponsored=ranked
    .filter(x=>x.sponsored && x.availability!=='sold-out' && x.fitsWindow)
    .sort((a,b)=>b.organicScore-a.organicScore || a.id.localeCompare(b.id));

  return {organic,sponsored};
}

export function discoveryQuickFilters(items:CityDiscoveryItem[], nowIso:string){
  const now=parseIso(nowIso);
  const openNow:CityDiscoveryItem[]=[];
  const starts30:CityDiscoveryItem[]=[];
  const starts60:CityDiscoveryItem[]=[];
  const starts120:CityDiscoveryItem[]=[];

  for(const item of items){
    const start=item.startsAt?parseIso(item.startsAt):null;
    const end=item.endsAt?parseIso(item.endsAt):null;
    if(start!==null && end!==null && start<=now && end>=now) openNow.push(item);
    if(start!==null){
      const minutes=(start-now)/60000;
      if(minutes>=0 && minutes<=30) starts30.push(item);
      if(minutes>=0 && minutes<=60) starts60.push(item);
      if(minutes>=0 && minutes<=120) starts120.push(item);
    }
  }

  return {openNow,starts30,starts60,starts120};
}
