import type { TravelEstimate } from './cityDiscoveryDecisionTypes.ts';

export type TravelContext = {
  originKey: string;
  mode: 'walk' | 'transit' | 'mixed';
};

export interface CityTravelTimeAdapter {
  estimate(itemId:string, context:TravelContext):TravelEstimate|undefined;
}

const DEMO_MINUTES:Record<string,number>={
  'demo-museum-evening':22,
  'demo-theatre-tonight':18,
  'demo-basmanny-exhibition':12,
  'demo-zamoskvorechye-dinner':20,
  'demo-presnya-event':32,
  'demo-vdnh-family':48,
  'demo-gorky-park':28,
  'demo-nightlife-khitrovka':14,
  'demo-market-shopping':34,
  'demo-free-architecture':16,
  'demo-sponsored-evening':24
};

export const demoCityTravelTimeAdapter:CityTravelTimeAdapter={
  estimate(itemId,context){
    const minutes=DEMO_MINUTES[itemId];
    if(minutes===undefined) return undefined;
    return {
      minutes,
      mode:context.mode,
      truth:'demo'
    };
  }
};

export function buildTravelEstimates(
  itemIds:string[],
  adapter:CityTravelTimeAdapter,
  context:TravelContext
){
  return Object.fromEntries(
    itemIds.flatMap((id)=>{
      const estimate=adapter.estimate(id,context);
      return estimate?[[id,estimate]]:[];
    })
  );
}
