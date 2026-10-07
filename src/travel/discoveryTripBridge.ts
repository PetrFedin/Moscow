import {
  addManualTripItem,
  resolvePersonalTripPreferences,
  type PersonalTrip,
  type PersonalTripCommitment,
  type PersonalTripItemKind
} from './personalTrip.ts';
import { deriveTripFreeWindows } from './tripScheduler.ts';
import type { CityDiscoveryItem, CityDiscoveryKind } from './cityDiscoveryEngine.ts';

export type DiscoveryTripPlacement = {
  id:string;
  dayDate:string;
  startsAt:string;
  endsAt:string;
  source:'event-time'|'free-window';
  conflict:boolean;
  conflictItemIds:string[];
  routingVerified:false;
};

function parseIso(value:string){
  const n=Date.parse(value);
  if(!Number.isFinite(n)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return n;
}

function dateOnlyMoscow(value:string){
  const d=new Date(parseIso(value));
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(d);
  const y=parts.find(x=>x.type==='year')?.value;
  const m=parts.find(x=>x.type==='month')?.value;
  const day=parts.find(x=>x.type==='day')?.value;
  if(!y||!m||!day) throw new Error('Cannot resolve Moscow date');
  return `${y}-${m}-${day}`;
}

function moscowTimestamp(dayDate:string,hhmm:string){
  if(!/^\d{2}:\d{2}$/.test(hhmm)) throw new Error(`Invalid HH:MM: ${hhmm}`);
  return `${dayDate}T${hhmm}:00+03:00`;
}

function overlaps(aStart:number,aEnd:number,bStart:number,bEnd:number){
  return Math.max(aStart,bStart)<Math.min(aEnd,bEnd);
}

export function discoveryKindToTripKind(kind:CityDiscoveryKind):PersonalTripItemKind{
  switch(kind){
    case 'heritage': return 'heritage';
    case 'museum': return 'museum';
    case 'restaurant':
    case 'cafe': return 'food';
    case 'theatre': return 'theatre';
    case 'bar':
    case 'nightlife': return 'bar';
    case 'shopping':
    case 'market': return 'shopping';
    case 'hotel': return 'stay';
    case 'mobility': return 'transport';
    case 'park': return 'nature';
    case 'activity':
    case 'family':
    case 'sport': return 'activity';
    case 'exhibition':
    case 'concert':
    case 'festival':
    case 'seasonal':
    case 'city-programme': return 'event';
    case 'viewpoint':
    case 'architecture': return 'other';
  }
}

export function discoveryItemTitle(item:CityDiscoveryItem,language:'ru'|'en'|'zh'){
  if(language==='en') return item.titleEn;
  if(language==='zh') return item.titleZh;
  return item.titleRu;
}

function scheduledConflicts(
  trip:PersonalTrip,
  dayDate:string,
  startsAt:string,
  endsAt:string
){
  const start=parseIso(startsAt);
  const end=parseIso(endsAt);
  return trip.items
    .filter(item=>item.dayDate===dayDate && item.status!=='cancelled' && item.status!=='skipped')
    .filter(item=>item.plannedStartAt && item.plannedEndAt)
    .filter(item=>overlaps(start,end,parseIso(item.plannedStartAt!),parseIso(item.plannedEndAt!)))
    .map(item=>item.id);
}

export function suggestDiscoveryTripPlacements(input:{
  trip:PersonalTrip;
  item:CityDiscoveryItem;
  maxPerDay?:number;
}):DiscoveryTripPlacement[]{
  const maxPerDay=input.maxPerDay??3;
  if(!Number.isInteger(maxPerDay)||maxPerDay<1||maxPerDay>10) throw new Error('maxPerDay invalid');

  const result:DiscoveryTripPlacement[]=[];

  if(input.item.startsAt){
    const dayDate=dateOnlyMoscow(input.item.startsAt);
    if(!input.trip.days.includes(dayDate)) return [];
    const startsAt=input.item.startsAt;
    const endsAt=input.item.endsAt
      ?? new Date(parseIso(startsAt)+input.item.durationMinutes*60_000).toISOString();
    const conflicts=scheduledConflicts(input.trip,dayDate,startsAt,endsAt);
    result.push({
      id:`${input.item.id}:${dayDate}:event`,
      dayDate,
      startsAt,
      endsAt,
      source:'event-time',
      conflict:conflicts.length>0,
      conflictItemIds:conflicts,
      routingVerified:false
    });
    return result;
  }

  const preferences=resolvePersonalTripPreferences(input.trip);

  for(const dayDate of input.trip.days){
    const windows=deriveTripFreeWindows({
      trip:input.trip,
      dayDate,
      dayStartsAt:moscowTimestamp(dayDate,preferences.dayStart),
      dayEndsAt:moscowTimestamp(dayDate,preferences.dayEnd),
      minimumMinutes:input.item.durationMinutes,
      reservedWindows:preferences.lunchWindow?[{
        startsAt:moscowTimestamp(dayDate,preferences.lunchWindow.start),
        endsAt:moscowTimestamp(dayDate,preferences.lunchWindow.end),
        reason:'meal'
      }]:[]
    });

    for(const window of windows.slice(0,maxPerDay)){
      const startsAt=window.startsAt;
      const endsAt=new Date(parseIso(startsAt)+input.item.durationMinutes*60_000).toISOString();
      if(parseIso(endsAt)>parseIso(window.endsAt)) continue;
      result.push({
        id:`${input.item.id}:${dayDate}:${startsAt}`,
        dayDate,
        startsAt,
        endsAt,
        source:'free-window',
        conflict:false,
        conflictItemIds:[],
        routingVerified:false
      });
    }
  }

  return result;
}

export function addDiscoveryItemToTrip(input:{
  trip:PersonalTrip;
  item:CityDiscoveryItem;
  placement:DiscoveryTripPlacement;
  language:'ru'|'en'|'zh';
  itemId:string;
  updatedAt:string;
  commitmentMode:'plan-only'|'user-ticket'|'user-reservation';
}){
  if(input.placement.conflict) throw new Error('Cannot add discovery item into conflicting placement');

  const commitment:PersonalTripCommitment|undefined=
    input.commitmentMode==='plan-only'
      ? undefined
      : {
          kind:input.commitmentMode==='user-ticket'?'ticket':'reservation',
          status:'confirmed',
          verification:'user-declared',
          sourceRef:input.item.sourceRef ?? `discovery:${input.item.truth}:${input.item.id}`
        };

  return addManualTripItem({
    trip:input.trip,
    itemId:input.itemId,
    dayDate:input.placement.dayDate,
    title:discoveryItemTitle(input.item,input.language),
    kind:discoveryKindToTripKind(input.item.kind),
    updatedAt:input.updatedAt,
    plannedStartAt:input.placement.startsAt,
    plannedEndAt:input.placement.endsAt,
    note:[
      `discoveryItemId=${input.item.id}`,
      `district=${input.item.district}`,
      `truth=${input.item.truth}`,
      `availabilityTruth=${input.item.availabilityTruth}`,
      'routingVerified=false'
    ].join('; '),
    ...(commitment?{commitment}:{})
  });
}
