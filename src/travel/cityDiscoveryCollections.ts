import type { CityDiscoveryItem, RankedDiscoveryItem } from './cityDiscoveryEngine.ts';
import { rankCityDiscovery, type DiscoveryContext } from './cityDiscoveryEngine.ts';

export type DiscoveryCollectionId =
  | 'tonight'
  | 'weekend'
  | 'rainy-day'
  | 'free'
  | 'new-district'
  | 'family'
  | 'after-theatre'
  | 'continue-evening';

export type DiscoveryCollection = {
  id:DiscoveryCollectionId;
  titleRu:string;
  titleEn:string;
  titleZh:string;
  items:RankedDiscoveryItem[];
};

function hourMoscow(value:string){
  return Number(new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/Moscow',
    hour:'2-digit',
    hour12:false
  }).format(new Date(value)));
}

function matches(id:DiscoveryCollectionId,item:CityDiscoveryItem,context:DiscoveryContext){
  switch(id){
    case 'tonight': {
      const startsHour=item.startsAt?hourMoscow(item.startsAt):null;
      return item.tags.includes('evening')||item.tags.includes('night')||(startsHour!==null&&startsHour>=17);
    }
    case 'weekend':
      return item.tags.includes('weekend')||item.kind==='park'||item.kind==='family'||item.kind==='market';
    case 'rainy-day':
      return item.weather?.suitability==='indoor'||item.weather?.suitability==='mixed'||item.tags.includes('rainy-day');
    case 'free':
      return item.priceClass==='free';
    case 'new-district':
      return !(context.visitedDistricts??[]).includes(item.district);
    case 'family':
      return item.family?.familyFriendly==='yes'||item.kind==='family'||item.tags.includes('family');
    case 'after-theatre':
      return item.tags.includes('after-theatre')||item.kind==='restaurant'||item.kind==='bar';
    case 'continue-evening':
      return item.tags.includes('continue-evening')||item.kind==='bar'||item.kind==='nightlife'||item.kind==='concert';
  }
}

const definitions:Array<Omit<DiscoveryCollection,'items'>>=[
  {id:'tonight',titleRu:'Сегодня вечером',titleEn:'Tonight',titleZh:'今晚'},
  {id:'weekend',titleRu:'Выходные',titleEn:'Weekend',titleZh:'周末'},
  {id:'rainy-day',titleRu:'Дождь',titleEn:'Rainy day',titleZh:'雨天'},
  {id:'free',titleRu:'Бесплатно',titleEn:'Free',titleZh:'免费'},
  {id:'new-district',titleRu:'Новый район',titleEn:'New district',titleZh:'新城区'},
  {id:'family',titleRu:'С детьми',titleEn:'With kids',titleZh:'亲子'},
  {id:'after-theatre',titleRu:'После театра',titleEn:'After theatre',titleZh:'剧院之后'},
  {id:'continue-evening',titleRu:'Продолжить вечер',titleEn:'Continue evening',titleZh:'继续夜晚'}
];

export function buildDiscoveryCollections(items:CityDiscoveryItem[],context:DiscoveryContext):DiscoveryCollection[]{
  return definitions.map(def=>{
    const filtered=items.filter(item=>matches(def.id,item,context));
    const ranked=rankCityDiscovery(filtered,context);
    return {...def,items:[...ranked.organic,...ranked.sponsored]};
  });
}
