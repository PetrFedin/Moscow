import type { PersonalTrip, PersonalTripItemKind, PersonalTripVisit } from './personalTrip.ts';

export const MOSCOW_MEMORY_SCHEMA_VERSION=1 as const;

export type MoscowMemoryEntry={
  id:string;
  title:string;
  kind:PersonalTripItemKind;
  firstVisitedAt:string;
  lastVisitedAt:string;
  visitCount:number;
  evidence:PersonalTripVisit['evidence'][];
  visitIds:string[];
  destinationNodeId?:string;
  discoveryItemId?:string;
};

export type MoscowMemory={
  schemaVersion:typeof MOSCOW_MEMORY_SCHEMA_VERSION;
  entries:MoscowMemoryEntry[];
  updatedAt:string;
};

export type MoscowMemoryNext={
  revisit:MoscowMemoryEntry[];
  unseenDiscoveryItemIds:string[];
};

function parseIso(value:string){
  const n=Date.parse(value);
  if(!Number.isFinite(n)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return n;
}

function normalizeTitle(value:string){
  return value.trim().toLocaleLowerCase('ru-RU');
}

function discoveryItemIdFromNote(note?:string){
  if(!note) return undefined;
  const token=note.split(';').map(x=>x.trim()).find(x=>x.startsWith('discoveryItemId='));
  const value=token?.slice('discoveryItemId='.length).trim();
  return value||undefined;
}

function kindForVisit(trip:PersonalTrip,visit:PersonalTripVisit):PersonalTripItemKind{
  if(visit.kind) return visit.kind;
  if(visit.itemId){
    const item=trip.items.find(x=>x.id===visit.itemId);
    if(item) return item.kind;
  }
  return 'other';
}

function entryIdentity(input:{
  visit:PersonalTripVisit;
  destinationNodeId?:string;
  discoveryItemId?:string;
}){
  if(input.discoveryItemId) return `discovery:${input.discoveryItemId}`;
  if(input.destinationNodeId) return `destination:${input.destinationNodeId}`;
  return `title:${normalizeTitle(input.visit.title)}`;
}

export function createEmptyMoscowMemory(at:string):MoscowMemory{
  parseIso(at);
  return {schemaVersion:MOSCOW_MEMORY_SCHEMA_VERSION,entries:[],updatedAt:at};
}

export function mergeTripIntoMoscowMemory(input:{
  memory:MoscowMemory;
  trip:PersonalTrip;
  updatedAt:string;
}):MoscowMemory{
  parseIso(input.updatedAt);
  const byId=new Map(input.memory.entries.map(entry=>[entry.id,{...entry,evidence:[...entry.evidence],visitIds:[...entry.visitIds]}]));

  for(const visit of input.trip.visits){
    const item=visit.itemId?input.trip.items.find(x=>x.id===visit.itemId):undefined;
    const discoveryItemId=discoveryItemIdFromNote(item?.note);
    const destinationNodeId=visit.destinationNodeId??item?.destinationNodeId;
    const id=entryIdentity({visit,destinationNodeId,discoveryItemId});
    const existing=byId.get(id);
    if(existing){
      if(existing.visitIds.includes(visit.id)) continue;
      existing.firstVisitedAt=existing.firstVisitedAt<visit.visitedAt?existing.firstVisitedAt:visit.visitedAt;
      existing.lastVisitedAt=existing.lastVisitedAt>visit.visitedAt?existing.lastVisitedAt:visit.visitedAt;
      existing.visitCount+=1;
      existing.visitIds.push(visit.id);
      if(!existing.evidence.includes(visit.evidence)) existing.evidence.push(visit.evidence);
      byId.set(id,existing);
    }else{
      byId.set(id,{
        id,
        title:visit.title,
        kind:kindForVisit(input.trip,visit),
        firstVisitedAt:visit.visitedAt,
        lastVisitedAt:visit.visitedAt,
        visitCount:1,
        evidence:[visit.evidence],
        visitIds:[visit.id],
        ...(destinationNodeId?{destinationNodeId}:{}),
        ...(discoveryItemId?{discoveryItemId}:{})
      });
    }
  }

  return {
    schemaVersion:MOSCOW_MEMORY_SCHEMA_VERSION,
    entries:[...byId.values()].sort((a,b)=>b.lastVisitedAt.localeCompare(a.lastVisitedAt)),
    updatedAt:input.updatedAt
  };
}

export function buildMoscowMemoryNext(input:{
  memory:MoscowMemory;
  discoveryItemIds:string[];
  revisitLimit?:number;
  unseenLimit?:number;
}):MoscowMemoryNext{
  const revisitLimit=input.revisitLimit??3;
  const unseenLimit=input.unseenLimit??6;
  const seenDiscovery=new Set(input.memory.entries.flatMap(x=>x.discoveryItemId?[x.discoveryItemId]:[]));

  const revisit=[...input.memory.entries]
    .sort((a,b)=>b.visitCount-a.visitCount||b.lastVisitedAt.localeCompare(a.lastVisitedAt))
    .slice(0,revisitLimit);

  return {
    revisit,
    unseenDiscoveryItemIds:input.discoveryItemIds.filter(id=>!seenDiscovery.has(id)).slice(0,unseenLimit)
  };
}

export function parseMoscowMemory(raw:string):MoscowMemory{
  const parsed=JSON.parse(raw) as Partial<MoscowMemory>;
  if(parsed.schemaVersion!==MOSCOW_MEMORY_SCHEMA_VERSION) throw new Error('Unsupported Moscow Memory schema');
  if(!Array.isArray(parsed.entries)||!parsed.updatedAt) throw new Error('Invalid Moscow Memory');
  parseIso(parsed.updatedAt);
  for(const entry of parsed.entries){
    if(!entry.id?.trim()||!entry.title?.trim()) throw new Error('Invalid Moscow Memory entry');
    parseIso(entry.firstVisitedAt);
    parseIso(entry.lastVisitedAt);
    if(!Number.isInteger(entry.visitCount)||entry.visitCount<1) throw new Error('Invalid Moscow Memory visit count');
    if(!Array.isArray(entry.evidence)||entry.evidence.length<1) throw new Error('Invalid Moscow Memory evidence');
    if(!Array.isArray(entry.visitIds)||entry.visitIds.length<1||entry.visitIds.some(id=>!id.trim())) throw new Error('Invalid Moscow Memory visit ids');
  }
  return {
    schemaVersion:MOSCOW_MEMORY_SCHEMA_VERSION,
    entries:parsed.entries.map(entry=>({...entry,evidence:[...entry.evidence],visitIds:[...entry.visitIds]})),
    updatedAt:parsed.updatedAt
  } as MoscowMemory;
}
