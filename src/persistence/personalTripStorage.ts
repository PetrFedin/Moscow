import AsyncStorage from '@react-native-async-storage/async-storage';

import { parsePersonalTrip, type PersonalTrip } from '../travel/personalTrip.ts';
import { syncTripToMoscowMemory } from './moscowMemoryStorage.ts';

export const PERSONAL_TRIP_STORAGE_KEY = 'moscow:v1:personal-trip';
export const PENDING_DISCOVERY_ADD_STORAGE_KEY = 'moscow:v1:pending-discovery-add';

export type PendingDiscoveryAdd = {
  version: 1;
  discoveryItemId: string;
  requestedMode: 'plan-only' | 'user-ticket' | 'user-reservation';
  requestedAt: string;
};

function validIso(value:string){
  return Number.isFinite(Date.parse(value));
}

export async function loadPersonalTrip():Promise<PersonalTrip|null>{
  const raw=await AsyncStorage.getItem(PERSONAL_TRIP_STORAGE_KEY);
  if(!raw) return null;
  return parsePersonalTrip(raw);
}

export async function savePersonalTrip(trip:PersonalTrip){
  await AsyncStorage.setItem(PERSONAL_TRIP_STORAGE_KEY,JSON.stringify(trip));
  await syncTripToMoscowMemory(trip,trip.updatedAt);
}

export async function clearPersonalTrip(){
  await AsyncStorage.removeItem(PERSONAL_TRIP_STORAGE_KEY);
}

export async function savePendingDiscoveryAdd(input:PendingDiscoveryAdd){
  if(input.version!==1) throw new Error('Unsupported pending discovery add version');
  if(!input.discoveryItemId.trim()) throw new Error('Discovery item id required');
  if(!validIso(input.requestedAt)) throw new Error('Invalid pending discovery timestamp');
  await AsyncStorage.setItem(PENDING_DISCOVERY_ADD_STORAGE_KEY,JSON.stringify(input));
}

export async function loadPendingDiscoveryAdd():Promise<PendingDiscoveryAdd|null>{
  const raw=await AsyncStorage.getItem(PENDING_DISCOVERY_ADD_STORAGE_KEY);
  if(!raw) return null;
  const parsed=JSON.parse(raw) as Partial<PendingDiscoveryAdd>;
  if(parsed.version!==1) return null;
  if(!parsed.discoveryItemId?.trim()) return null;
  if(!parsed.requestedMode || !['plan-only','user-ticket','user-reservation'].includes(parsed.requestedMode)) return null;
  if(!parsed.requestedAt || !validIso(parsed.requestedAt)) return null;
  return parsed as PendingDiscoveryAdd;
}

export async function clearPendingDiscoveryAdd(){
  await AsyncStorage.removeItem(PENDING_DISCOVERY_ADD_STORAGE_KEY);
}
