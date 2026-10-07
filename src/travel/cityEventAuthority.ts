export type CityEventRecurrence =
  | { kind:'none' }
  | { kind:'daily'; until:string }
  | { kind:'weekly'; weekdays:number[]; until:string };

export type CityVenue = {
  id:string;
  district:string;
  titleRu:string;
  titleEn:string;
  titleZh:string;
  latitude:number;
  longitude:number;
  addressRu?:string;
  sourceRef:string;
  truth:'demo'|'editorial'|'partner'|'provider';
};

export type CityEvent = {
  id:string;
  venueId:string;
  organiserId:string;
  category:'exhibition'|'theatre'|'concert'|'festival'|'sport'|'family'|'city-programme';
  titleRu:string;
  titleEn:string;
  titleZh:string;
  startsAt:string;
  endsAt:string;
  recurrence:CityEventRecurrence;
  minAge?:number;
  languages?:Array<'ru'|'en'|'zh'>;
  priceClass:'free'|'budget'|'mid'|'premium'|'unknown';
  ticketRoute:'none'|'deep-link'|'provider';
  ticketUrl?:string;
  accessibilityState:'unknown'|'partial'|'verified';
  sourceRef:string;
  freshnessAt:string;
  truth:'demo'|'editorial'|'partner'|'provider';
};

export type CityEventOccurrence = {
  eventId:string;
  venueId:string;
  startsAt:string;
  endsAt:string;
};

function parseIso(value:string){
  const n=Date.parse(value);
  if(!Number.isFinite(n)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return n;
}

function iso(ms:number){ return new Date(ms).toISOString(); }

function dayUtc(ms:number){ return new Date(ms).getUTCDay(); }

export function validateCityVenue(venue:CityVenue){
  const blockers:string[]=[];
  if(!venue.id.trim()) blockers.push('id');
  if(!venue.district.trim()) blockers.push('district');
  if(!venue.titleRu.trim()) blockers.push('titleRu');
  if(!venue.sourceRef.trim()) blockers.push('sourceRef');
  if(!Number.isFinite(venue.latitude)||venue.latitude < -90||venue.latitude > 90) blockers.push('latitude');
  if(!Number.isFinite(venue.longitude)||venue.longitude < -180||venue.longitude > 180) blockers.push('longitude');
  return {valid:blockers.length===0,blockers};
}

export function validateCityEvent(event:CityEvent){
  const blockers:string[]=[];
  const start=parseIso(event.startsAt);
  const end=parseIso(event.endsAt);
  parseIso(event.freshnessAt);
  if(end<=start) blockers.push('time-range');
  if(!event.id.trim()) blockers.push('id');
  if(!event.venueId.trim()) blockers.push('venueId');
  if(!event.organiserId.trim()) blockers.push('organiserId');
  if(!event.sourceRef.trim()) blockers.push('sourceRef');
  if(event.minAge!==undefined && (!Number.isInteger(event.minAge)||event.minAge<0||event.minAge>21)) blockers.push('minAge');
  if(event.ticketRoute==='deep-link' && !/^https:\/\//i.test(event.ticketUrl??'')) blockers.push('ticketUrl');
  if(event.ticketRoute!=='deep-link' && event.ticketUrl) blockers.push('unexpectedTicketUrl');

  if(event.recurrence.kind!=='none'){
    const until=parseIso(event.recurrence.until);
    if(until<start) blockers.push('recurrence-until');
  }
  if(event.recurrence.kind==='weekly'){
    const unique=new Set(event.recurrence.weekdays);
    if(unique.size!==event.recurrence.weekdays.length) blockers.push('duplicate-weekday');
    if(event.recurrence.weekdays.some(x=>!Number.isInteger(x)||x<0||x>6)) blockers.push('weekday');
  }
  return {valid:blockers.length===0,blockers};
}

export function expandCityEventOccurrences(input:{
  event:CityEvent;
  from:string;
  to:string;
  maxOccurrences?:number;
}):CityEventOccurrence[]{
  const validation=validateCityEvent(input.event);
  if(!validation.valid) throw new Error(`Invalid city event: ${validation.blockers.join(',')}`);

  const from=parseIso(input.from);
  const to=parseIso(input.to);
  if(to<from) throw new Error('Occurrence range invalid');
  const max=input.maxOccurrences??100;
  if(max<1||max>500) throw new Error('Invalid maxOccurrences');

  const baseStart=parseIso(input.event.startsAt);
  const baseEnd=parseIso(input.event.endsAt);
  const duration=baseEnd-baseStart;
  const recurrence=input.event.recurrence;
  const occurrences:CityEventOccurrence[]=[];

  const push=(start:number)=>{
    const end=start+duration;
    if(end<from||start>to) return;
    occurrences.push({
      eventId:input.event.id,
      venueId:input.event.venueId,
      startsAt:iso(start),
      endsAt:iso(end)
    });
  };

  if(recurrence.kind==='none'){
    push(baseStart);
    return occurrences;
  }

  const until=parseIso(recurrence.until);
  for(let cursor=baseStart;cursor<=until && occurrences.length<max;cursor+=86_400_000){
    if(recurrence.kind==='daily'){
      push(cursor);
      continue;
    }
    if(recurrence.kind==='weekly' && recurrence.weekdays.includes(dayUtc(cursor))) push(cursor);
  }

  return occurrences;
}
