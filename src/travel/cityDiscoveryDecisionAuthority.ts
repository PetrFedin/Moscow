import type { CityDiscoveryItem } from './cityDiscoveryEngine.ts';
import type {
  AccessibilityFit,
  DiscoveryDecision,
  DiscoveryDecisionContext,
  DiscoveryPriceClass,
  FamilyFit,
  OpeningHoursProfile,
  OpeningState,
  PriceFit,
  TravelFit,
  WeatherFit
} from './cityDiscoveryDecisionTypes.ts';

function parseIso(value:string){
  const n=Date.parse(value);
  if(!Number.isFinite(n)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return n;
}

function hhmmToMinutes(value:string){
  if(!/^\d{2}:\d{2}$/.test(value)) throw new Error(`Invalid HH:MM: ${value}`);
  const parts=value.split(':').map(Number);
  const h=parts[0];
  const m=parts[1];
  if(h===undefined||m===undefined||!Number.isInteger(h)||!Number.isInteger(m)||h<0||h>23||m<0||m>59) {
    throw new Error(`Invalid HH:MM: ${value}`);
  }
  return h*60+m;
}

function moscowClock(value:string){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/Moscow',
    weekday:'short',
    hour:'2-digit',
    minute:'2-digit',
    hour12:false
  }).formatToParts(new Date(parseIso(value)));
  const weekday=parts.find(p=>p.type==='weekday')?.value ?? 'Mon';
  const hour=Number(parts.find(p=>p.type==='hour')?.value ?? '0');
  const minute=Number(parts.find(p=>p.type==='minute')?.value ?? '0');
  const weekdays:{[key:string]:number}={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  return {weekday:(weekdays[weekday] ?? 1) as 0|1|2|3|4|5|6,minutes:hour*60+minute,date:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(parseIso(value)))};
}

export function openingStateAt(profile:OpeningHoursProfile|undefined, nowIso:string, durationMinutes:number):OpeningState{
  if(!profile) return 'unknown';
  const clock=moscowClock(nowIso);
  const exception=profile.exceptions?.find(x=>x.date===clock.date);
  if(exception?.closed) return 'closed';

  const intervals=exception?.intervals ?? profile.weekly.find(x=>x.weekday===clock.weekday)?.intervals ?? [];
  if(intervals.length===0) return profile.truth==='unknown'?'unknown':'closed';

  for(const interval of intervals){
    const opens=hhmmToMinutes(interval.opens);
    const closes=hhmmToMinutes(interval.closes);
    if(clock.minutes>=opens && clock.minutes<closes){
      return clock.minutes+durationMinutes<=closes ? 'open' : 'closing-soon';
    }
  }
  return 'closed';
}

const priceOrder:Record<DiscoveryPriceClass,number>={free:0,budget:1,mid:2,premium:3,unknown:99};

export function priceFitFor(price:DiscoveryPriceClass|undefined, preference:DiscoveryPriceClass|undefined):PriceFit{
  if(!price||price==='unknown'||!preference||preference==='unknown') return 'unknown';
  if(priceOrder[price]<=priceOrder[preference]) return 'good';
  if(priceOrder[price]===priceOrder[preference]+1) return 'acceptable';
  return 'over-budget';
}

export function familyFitFor(item:CityDiscoveryItem, ages:number[]|undefined, nowIso:string):FamilyFit{
  if(!ages||ages.length===0) return 'good';
  const p=item.family;
  if(!p||p.familyFriendly==='unknown') return 'unknown';
  if(p.familyFriendly==='no') return 'ineligible';
  if(p.minAge!==undefined && ages.some(age=>age<p.minAge!)) return 'ineligible';
  if(p.maxAge!==undefined && ages.some(age=>age>p.maxAge!)) return 'caution';
  if(p.adultOnlyAfter){
    const now=moscowClock(nowIso).minutes;
    if(now>=hhmmToMinutes(p.adultOnlyAfter)) return 'ineligible';
  }
  return p.familyFriendly==='partial'?'caution':'good';
}

export function accessibilityFitFor(item:CityDiscoveryItem,intent:DiscoveryDecisionContext['accessibilityIntent']):AccessibilityFit{
  if(!intent||intent==='none') return 'good';
  const state=item.accessibility?.stepFree ?? 'unknown';
  if(state==='verified') return 'good';
  if(state==='partial') return intent==='required'?'ineligible':'caution';
  if(state==='not-available') return intent==='required'?'ineligible':'caution';
  return intent==='required'?'needs-verification':'unknown';
}

export function weatherFitFor(item:CityDiscoveryItem,weather:DiscoveryDecisionContext['weather']):WeatherFit{
  if(!weather||weather==='unknown') return 'unknown';
  const suitability=item.weather?.suitability ?? 'unknown';
  if(suitability==='unknown') return 'unknown';
  if(weather==='rain'||weather==='snow'){
    if(suitability==='indoor') return 'good';
    if(suitability==='mixed') return 'caution';
    return 'caution';
  }
  return 'good';
}

export function travelFitFor(input:{
  durationMinutes:number;
  freeWindowMinutes:number;
  travelMinutes?:number;
}):{fit:TravelFit;totalMinutes?:number;experienceShare?:number}{
  if(input.travelMinutes===undefined) {
    return input.durationMinutes<=input.freeWindowMinutes
      ? {fit:'unknown'}
      : {fit:'does-not-fit'};
  }
  const total=input.durationMinutes+input.travelMinutes;
  const share=input.durationMinutes/Math.max(1,total);
  if(total>input.freeWindowMinutes) return {fit:'does-not-fit',totalMinutes:total,experienceShare:share};
  if(share<0.45) return {fit:'not-worth-it',totalMinutes:total,experienceShare:share};
  if(total>input.freeWindowMinutes*0.85) return {fit:'tight',totalMinutes:total,experienceShare:share};
  return {fit:'good',totalMinutes:total,experienceShare:share};
}

export function evaluateDiscoveryDecision(item:CityDiscoveryItem,context:DiscoveryDecisionContext):DiscoveryDecision{
  const openingState=openingStateAt(item.openingHours,context.now,item.durationMinutes);
  const priceFit=priceFitFor(item.priceClass,context.budgetPreference);
  const familyFit=familyFitFor(item,context.childrenAges,context.now);
  const accessibilityFit=accessibilityFitFor(item,context.accessibilityIntent);
  const weatherFit=weatherFitFor(item,context.weather);
  const travel=context.travelByItemId?.[item.id];
  const travelEval=travelFitFor({
    durationMinutes:item.durationMinutes,
    freeWindowMinutes:context.freeWindowMinutes,
    travelMinutes:travel?.minutes
  });

  const blockers:string[]=[];
  const cautions:string[]=[];
  const positiveReasons:string[]=[];

  if(item.availability==='sold-out') blockers.push('sold-out');
  if(openingState==='closed') blockers.push('closed');
  if(openingState==='closing-soon') cautions.push('closing-soon');
  if(openingState==='unknown') cautions.push('opening-hours-unknown');
  if(priceFit==='over-budget' && context.budgetStrict) blockers.push('over-budget');
  else if(priceFit==='over-budget') cautions.push('over-budget');
  if(familyFit==='ineligible') blockers.push('family-ineligible');
  else if(familyFit==='caution'||familyFit==='unknown') cautions.push(`family-${familyFit}`);
  if(accessibilityFit==='ineligible') blockers.push('accessibility-ineligible');
  else if(accessibilityFit==='needs-verification') blockers.push('accessibility-needs-verification');
  else if(accessibilityFit==='caution'||accessibilityFit==='unknown') cautions.push(`accessibility-${accessibilityFit}`);
  if(travelEval.fit==='does-not-fit') blockers.push('does-not-fit-window');
  else if(travelEval.fit==='not-worth-it'||travelEval.fit==='tight') cautions.push(`travel-${travelEval.fit}`);
  else if(travelEval.fit==='unknown') cautions.push('travel-unknown');
  if(weatherFit==='caution') cautions.push('weather-caution');
  if(weatherFit==='unknown') cautions.push('weather-unknown');

  if(openingState==='open') positiveReasons.push('open-now');
  if(priceFit==='good') positiveReasons.push(item.priceClass==='free'?'free':'budget-fit');
  if(familyFit==='good' && (context.childrenAges?.length??0)>0) positiveReasons.push('family-fit');
  if(accessibilityFit==='good' && context.accessibilityIntent && context.accessibilityIntent!=='none') positiveReasons.push('accessibility-fit');
  if(travelEval.fit==='good') positiveReasons.push('good-time-value');
  if(weatherFit==='good' && context.weather && context.weather!=='unknown') positiveReasons.push('weather-fit');
  if(context.currentDistrict && item.district===context.currentDistrict) positiveReasons.push('same-district');
  if(context.visitedDistricts && !context.visitedDistricts.includes(item.district)) positiveReasons.push('new-district');

  let score=1;
  score += positiveReasons.length*0.08;
  score -= cautions.length*0.05;
  score -= blockers.length*0.35;
  if(travelEval.experienceShare!==undefined) score += Math.max(-0.1,(travelEval.experienceShare-0.5)*0.2);

  return {
    eligible:blockers.length===0,
    openingState,
    priceFit,
    familyFit,
    accessibilityFit,
    travelFit:travelEval.fit,
    weatherFit,
    ...(travel?{travelMinutes:travel.minutes}:{}),
    ...(travelEval.totalMinutes!==undefined?{totalMinutes:travelEval.totalMinutes}:{}),
    ...(travelEval.experienceShare!==undefined?{experienceShare:Number(travelEval.experienceShare.toFixed(3))}:{}),
    decisionScore:Number(Math.max(0,score).toFixed(4)),
    positiveReasons,
    cautions,
    blockers
  };
}
