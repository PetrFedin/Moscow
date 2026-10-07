import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createEmptyMoscowMemory,
  mergeTripIntoMoscowMemory,
  parseMoscowMemory,
  type MoscowMemory
} from '../travel/moscowMemory.ts';
import type { PersonalTrip } from '../travel/personalTrip.ts';

export const MOSCOW_MEMORY_STORAGE_KEY='moscow:v1:memory';

export async function loadMoscowMemory():Promise<MoscowMemory>{
  const raw=await AsyncStorage.getItem(MOSCOW_MEMORY_STORAGE_KEY);
  if(!raw) return createEmptyMoscowMemory(new Date().toISOString());
  return parseMoscowMemory(raw);
}

export async function saveMoscowMemory(memory:MoscowMemory){
  await AsyncStorage.setItem(MOSCOW_MEMORY_STORAGE_KEY,JSON.stringify(memory));
}

export async function syncTripToMoscowMemory(trip:PersonalTrip,updatedAt=new Date().toISOString()){
  const current=await loadMoscowMemory();
  const next=mergeTripIntoMoscowMemory({memory:current,trip,updatedAt});
  await saveMoscowMemory(next);
  return next;
}
