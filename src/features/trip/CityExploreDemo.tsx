import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { buildDiscoveryCollections, type DiscoveryCollectionId } from '../../travel/cityDiscoveryCollections';
import { cityDiscoveryDemoCatalog } from '../../travel/cityDiscoveryDemoCatalog';
import type { DiscoveryPriceClass } from '../../travel/cityDiscoveryDecisionTypes';
import {
  discoveryQuickFilters,
  rankCityDiscovery,
  type CityDiscoveryKind,
  type RankedDiscoveryItem
} from '../../travel/cityDiscoveryEngine';
import { buildTravelEstimates, demoCityTravelTimeAdapter } from '../../travel/cityTravelTimeAdapter';

type Props = {
  language: AppLanguage;
  onAddToTrip: (itemId: string) => void;
};

type WindowFilter = 45 | 90 | 120 | 180;
type PartyMode = 'adult' | 'family';
type WeatherMode = 'clear' | 'rain';
type AccessMode = 'none' | 'required';

const preferredKinds:CityDiscoveryKind[]=['museum','exhibition','theatre','restaurant','concert','park','bar','shopping','family'];

function collectionTitle(language:AppLanguage, collection:{titleRu:string;titleEn:string;titleZh:string}){
  return language==='en'?collection.titleEn:language==='zh'?collection.titleZh:collection.titleRu;
}

function openingLabel(language:AppLanguage,item:RankedDiscoveryItem){
  switch(item.decision.openingState){
    case 'open': return tr(language,'ОТКРЫТО','OPEN','营业中');
    case 'closing-soon': return tr(language,'СКОРО ЗАКРЫТИЕ','CLOSING SOON','即将关闭');
    case 'closed': return tr(language,'ЗАКРЫТО','CLOSED','已关闭');
    default: return tr(language,'ЧАСЫ НЕ ПРОВЕРЕНЫ','HOURS UNKNOWN','营业时间未知');
  }
}

function reasonLabel(language:AppLanguage,reason:string){
  const labels:Record<string,[string,string,string]>={
    'open-now':['Открыто сейчас','Open now','当前开放'],
    'free':['Бесплатно','Free','免费'],
    'budget-fit':['Подходит по бюджету','Budget fit','符合预算'],
    'family-fit':['Подходит с детьми','Family fit','适合亲子'],
    'accessibility-fit':['Step-free подходит','Step-free fit','无障碍适配'],
    'good-time-value':['Дорога оправдана','Good time value','交通时间合理'],
    'weather-fit':['Подходит погоде','Weather fit','适合天气'],
    'same-district':['В этом районе','Same district','同一区域'],
    'new-district':['Новый район','New district','新城区']
  };
  const v=labels[reason];
  return v?tr(language,v[0],v[1],v[2]):reason;
}

function cautionLabel(language:AppLanguage,caution:string){
  if(caution==='opening-hours-unknown') return tr(language,'Часы не подтверждены','Hours not verified','营业时间未核验');
  if(caution==='travel-unknown') return tr(language,'Дорога не подтверждена','Travel not verified','交通未核验');
  if(caution==='travel-tight') return tr(language,'Плотно по времени','Tight on time','时间较紧');
  if(caution==='travel-not-worth-it') return tr(language,'Много времени на дорогу','High travel friction','交通耗时较高');
  if(caution==='weather-caution') return tr(language,'Погода может мешать','Weather caution','天气可能影响');
  if(caution.startsWith('family-')) return tr(language,'Проверьте для детей','Check family fit','请核对亲子适配');
  if(caution.startsWith('accessibility-')) return tr(language,'Доступность требует проверки','Accessibility needs checking','无障碍需核验');
  if(caution==='over-budget') return tr(language,'Выше выбранного бюджета','Above budget','超出预算');
  return caution;
}

export default function CityExploreDemo({language,onAddToTrip}:Props){
  const [windowMinutes,setWindowMinutes]=useState<WindowFilter>(120);
  const [kind,setKind]=useState<CityDiscoveryKind | 'all'>('all');
  const [quick,setQuick]=useState<'fit'|'now'|'30'|'60'|'120'>('fit');
  const [collectionId,setCollectionId]=useState<DiscoveryCollectionId|null>(null);
  const [party,setParty]=useState<PartyMode>('adult');
  const [weather,setWeather]=useState<WeatherMode>('clear');
  const [access,setAccess]=useState<AccessMode>('none');
  const [budget,setBudget]=useState<DiscoveryPriceClass>('mid');

  const now='2026-10-07T17:10:00+03:00';
  const quickSets=useMemo(()=>discoveryQuickFilters(cityDiscoveryDemoCatalog,now),[]);
  const travelByItemId=useMemo(
    ()=>buildTravelEstimates(
      cityDiscoveryDemoCatalog.map(item=>item.id),
      demoCityTravelTimeAdapter,
      {originKey:'demo-basmanny-origin',mode:'mixed'}
    ),
    []
  );

  const context=useMemo(()=>({
    now,
    freeWindowMinutes:windowMinutes,
    preferredKinds:kind==='all'?preferredKinds:[kind],
    visitedIds:['demo-gorky-park'],
    currentDistrict:'Басманный',
    visitedDistricts:['Якиманка','Тверской'],
    budgetPreference:budget,
    budgetStrict:false,
    childrenAges:party==='family'?[8]:[],
    accessibilityIntent:access,
    weather,
    travelByItemId
  }),[access,budget,kind,party,travelByItemId,weather,windowMinutes]);

  const collections=useMemo(
    ()=>buildDiscoveryCollections(cityDiscoveryDemoCatalog,context),
    [context]
  );

  const collectionIds=useMemo(
    ()=>new Set(collections.find(collection=>collection.id===collectionId)?.items.map(item=>item.id) ?? []),
    [collectionId,collections]
  );

  const filtered=useMemo(()=>{
    let source=cityDiscoveryDemoCatalog;
    if(collectionId) source=source.filter(item=>collectionIds.has(item.id));
    if(quick==='now') source=source.filter(item=>quickSets.openNow.some(x=>x.id===item.id));
    if(quick==='30') source=source.filter(item=>quickSets.starts30.some(x=>x.id===item.id));
    if(quick==='60') source=source.filter(item=>quickSets.starts60.some(x=>x.id===item.id));
    if(quick==='120') source=source.filter(item=>quickSets.starts120.some(x=>x.id===item.id));
    if(kind!=='all') source=source.filter(item=>item.kind===kind);
    return source;
  },[collectionId,collectionIds,kind,quick,quickSets]);

  const ranked=useMemo(()=>rankCityDiscovery(filtered,context),[context,filtered]);
  const excluded=Math.max(0,filtered.length-ranked.organic.length-ranked.sponsored.length);

  const renderCard=(item:RankedDiscoveryItem,index:number,sponsored=false)=>(
    <View key={item.id} style={[styles.card,sponsored&&styles.sponsored]}>
      {sponsored&&<Text style={styles.sponsoredLabel}>{tr(language,'РЕКЛАМА / ПАРТНЁР','SPONSORED','赞助')}</Text>}
      <View style={styles.cardTop}>
        {!sponsored&&<Text style={styles.rank}>{index+1}</Text>}
        <View style={styles.flex}>
          <Text style={styles.cardMeta}>{item.district} · {item.kind} · {item.durationMinutes} min</Text>
          <Text style={styles.cardTitle}>{language==='en'?item.titleEn:language==='zh'?item.titleZh:item.titleRu}</Text>
        </View>
        {!sponsored&&<Text style={styles.score}>{item.organicScore.toFixed(2)}</Text>}
      </View>

      <View style={styles.decisionRow}>
        <Text style={styles.decisionPrimary}>{openingLabel(language,item)}</Text>
        {item.decision.travelMinutes!==undefined&&(
          <Text style={styles.decisionSecondary}>
            {tr(language,`дорога ~${item.decision.travelMinutes} мин`,`travel ~${item.decision.travelMinutes} min`,`交通约${item.decision.travelMinutes}分钟`)}
          </Text>
        )}
        {item.priceClass&&item.priceClass!=='unknown'&&(
          <Text style={styles.decisionSecondary}>{item.priceClass.toUpperCase()}</Text>
        )}
      </View>

      <View style={styles.tags}>
        {item.isNew&&<Text style={styles.tag}>{tr(language,'НОВОЕ ДЛЯ МЕНЯ','NEW FOR ME','对我来说是新的')}</Text>}
        {item.decision.positiveReasons.slice(0,3).map(reason=><Text key={reason} style={styles.goodTag}>{reasonLabel(language,reason)}</Text>)}
        {item.decision.cautions.slice(0,2).map(reason=><Text key={reason} style={styles.cautionTag}>{cautionLabel(language,reason)}</Text>)}
        <Text style={styles.tag}>DEMO</Text>
        {item.startsInMinutes!==undefined&&item.startsInMinutes>=0&&(
          <Text style={styles.tag}>{tr(language,`через ${item.startsInMinutes} мин`,`in ${item.startsInMinutes} min`,`${item.startsInMinutes}分钟后`)}</Text>
        )}
      </View>

      {item.decision.totalMinutes!==undefined&&(
        <Text style={styles.fitNote}>
          {tr(
            language,
            `Всего ~${item.decision.totalMinutes} мин с дорогой · на само место ${Math.round((item.decision.experienceShare??0)*100)}%`,
            `~${item.decision.totalMinutes} min incl. travel · ${Math.round((item.decision.experienceShare??0)*100)}% is actual experience`,
            `含交通约${item.decision.totalMinutes}分钟 · 实际体验占${Math.round((item.decision.experienceShare??0)*100)}%`
          )}
        </Text>
      )}

      <PhysicalPressable
        style={styles.addToTrip}
        contentStyle={styles.center}
        accessibilityLabel={tr(language,`Добавить ${item.titleRu} в поездку`,`Add ${item.titleEn} to trip`,`将${item.titleZh}加入行程`)}
        onPress={()=>onAddToTrip(item.id)}
      >
        <Text style={styles.addToTripText}>{tr(language,'В поездку','Add to trip','加入行程')} →</Text>
      </PhysicalPressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{tr(language,'EXPLORE MOSCOW · DEMO','EXPLORE MOSCOW · DEMO','探索莫斯科 · DEMO')}</Text>
      <Text style={styles.title}>{tr(language,'Что делать прямо сейчас?','What should I do now?','现在做什么？')}</Text>
      <Text style={styles.body}>
        {tr(
          language,
          'Решение учитывает свободное время, часы работы, бюджет, состав группы, доступность, погоду и цену дороги по времени.',
          'The decision considers your free window, opening hours, budget, party, accessibility, weather and travel-time cost.',
          '推荐会综合空闲时间、营业时间、预算、同行人员、无障碍、天气和交通时间成本。'
        )}
      </Text>

      <Text style={styles.label}>{tr(language,'ПОДБОРКИ','COLLECTIONS','精选')}</Text>
      <View style={styles.chips}>
        <PhysicalPressable style={[styles.chip,!collectionId&&styles.chipActive]} contentStyle={styles.center} onPress={()=>setCollectionId(null)}>
          <Text style={[styles.chipText,!collectionId&&styles.chipTextActive]}>{tr(language,'Для меня','For me','为我推荐')}</Text>
        </PhysicalPressable>
        {collections.map(collection=>(
          <PhysicalPressable
            key={collection.id}
            style={[styles.chip,collectionId===collection.id&&styles.chipActive]}
            contentStyle={styles.center}
            onPress={()=>setCollectionId(collection.id)}
          >
            <Text style={[styles.chipText,collectionId===collection.id&&styles.chipTextActive]}>
              {collectionTitle(language,collection)} · {collection.items.length}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.label}>{tr(language,'КОНТЕКСТ','CONTEXT','情境')}</Text>
      <View style={styles.contextGrid}>
        <View style={styles.contextBlock}>
          <Text style={styles.contextLabel}>{tr(language,'Состав','Party','同行')}</Text>
          <View style={styles.miniRow}>
            {(['adult','family'] as PartyMode[]).map(value=>(
              <PhysicalPressable key={value} style={[styles.miniChip,party===value&&styles.miniChipActive]} contentStyle={styles.center} onPress={()=>setParty(value)}>
                <Text style={[styles.miniText,party===value&&styles.miniTextActive]}>
                  {value==='adult'?tr(language,'Взрослые','Adults','成人'):tr(language,'С ребёнком','With child','亲子')}
                </Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>
        <View style={styles.contextBlock}>
          <Text style={styles.contextLabel}>{tr(language,'Погода','Weather','天气')}</Text>
          <View style={styles.miniRow}>
            {(['clear','rain'] as WeatherMode[]).map(value=>(
              <PhysicalPressable key={value} style={[styles.miniChip,weather===value&&styles.miniChipActive]} contentStyle={styles.center} onPress={()=>setWeather(value)}>
                <Text style={[styles.miniText,weather===value&&styles.miniTextActive]}>
                  {value==='clear'?tr(language,'Сухо','Clear','晴'):tr(language,'Дождь','Rain','雨')}
                </Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>
        <View style={styles.contextBlock}>
          <Text style={styles.contextLabel}>{tr(language,'Доступность','Accessibility','无障碍')}</Text>
          <View style={styles.miniRow}>
            {(['none','required'] as AccessMode[]).map(value=>(
              <PhysicalPressable key={value} style={[styles.miniChip,access===value&&styles.miniChipActive]} contentStyle={styles.center} onPress={()=>setAccess(value)}>
                <Text style={[styles.miniText,access===value&&styles.miniTextActive]}>
                  {value==='none'?tr(language,'Обычно','Standard','普通'):tr(language,'Step-free','Step-free','无障碍')}
                </Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>
        <View style={styles.contextBlock}>
          <Text style={styles.contextLabel}>{tr(language,'Бюджет','Budget','预算')}</Text>
          <View style={styles.miniRow}>
            {(['budget','mid','premium'] as DiscoveryPriceClass[]).map(value=>(
              <PhysicalPressable key={value} style={[styles.miniChip,budget===value&&styles.miniChipActive]} contentStyle={styles.center} onPress={()=>setBudget(value)}>
                <Text style={[styles.miniText,budget===value&&styles.miniTextActive]}>{value.toUpperCase()}</Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.label}>{tr(language,'КОГДА','WHEN','时间')}</Text>
      <View style={styles.chips}>
        {[
          ['fit',tr(language,'Подходит в окно','Fits my window','适合空档')],
          ['now',tr(language,'Сейчас','Now','现在')],
          ['30',tr(language,'Через 30 мин','In 30 min','30分钟内')],
          ['60',tr(language,'Через 60 мин','In 60 min','60分钟内')],
          ['120',tr(language,'Через 2 часа','In 2 hours','2小时内')]
        ].map(([id,label])=>(
          <PhysicalPressable key={id} style={[styles.chip,quick===id&&styles.chipActive]} contentStyle={styles.center} onPress={()=>setQuick(id as typeof quick)}>
            <Text style={[styles.chipText,quick===id&&styles.chipTextActive]}>{label}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.label}>{tr(language,'СВОБОДНОЕ ВРЕМЯ','FREE WINDOW','空闲时间')}</Text>
      <View style={styles.chips}>
        {([45,90,120,180] as WindowFilter[]).map(value=>(
          <PhysicalPressable key={value} style={[styles.chip,windowMinutes===value&&styles.chipActive]} contentStyle={styles.center} onPress={()=>setWindowMinutes(value)}>
            <Text style={[styles.chipText,windowMinutes===value&&styles.chipTextActive]}>{value} min</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.label}>{tr(language,'КАТЕГОРИЯ','CATEGORY','类别')}</Text>
      <View style={styles.chips}>
        {[
          ['all',tr(language,'Всё','All','全部')],
          ['museum',tr(language,'Музеи','Museums','博物馆')],
          ['exhibition',tr(language,'Выставки','Exhibitions','展览')],
          ['restaurant',tr(language,'Еда','Food','美食')],
          ['theatre',tr(language,'Театр','Theatre','剧院')],
          ['concert',tr(language,'События','Events','活动')],
          ['bar',tr(language,'Вечер','Night','夜生活')]
        ].map(([id,label])=>(
          <PhysicalPressable key={id} style={[styles.chip,kind===id&&styles.chipActive]} contentStyle={styles.center} onPress={()=>setKind(id as CityDiscoveryKind|'all')}>
            <Text style={[styles.chipText,kind===id&&styles.chipTextActive]}>{label}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{tr(language,'Лучшее по смыслу','Best organic matches','最佳自然推荐')}</Text>
        <Text style={styles.count}>{ranked.organic.length}</Text>
      </View>
      {excluded>0&&(
        <Text style={styles.excluded}>
          {tr(
            language,
            `${excluded} вариантов скрыто из-за текущих ограничений`,
            `${excluded} options hidden by current constraints`,
            `有${excluded}个选项因当前条件被隐藏`
          )}
        </Text>
      )}

      {ranked.organic.slice(0,6).map((item,index)=>renderCard(item,index,false))}

      {ranked.sponsored.length>0&&(
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{tr(language,'Партнёрские предложения','Sponsored offers','赞助推荐')}</Text>
          </View>
          {ranked.sponsored.map((item,index)=>renderCard(item,index,true))}
        </>
      )}

      <Text style={styles.guardrail}>
        {tr(
          language,
          'DEMO-параметры часов, дороги и доступности показывают механику Decision Engine, а не live-факты. Organic ranking и paid placement разделены.',
          'DEMO hours, travel and accessibility show Decision Engine mechanics, not live facts. Organic ranking and paid placement remain separate.',
          'DEMO 营业时间、交通和无障碍数据仅展示 Decision Engine 机制，并非实时事实。自然排序与付费展示保持分离。'
        )}
      </Text>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{borderRadius:22,padding:17,backgroundColor:'#101316',borderWidth:1,borderColor:'#2d3339',marginBottom:20},
  kicker:{color:'#b99b69',fontSize:8,letterSpacing:1.2,fontWeight:'900'},
  title:{color:'#f5efe4',fontSize:20,lineHeight:25,fontWeight:'900',marginTop:5},
  body:{color:'#939aa1',fontSize:10.5,lineHeight:16,marginTop:7},
  label:{color:'#70777e',fontSize:7.5,fontWeight:'900',letterSpacing:1.1,marginTop:12,marginBottom:6},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:6},
  chip:{minHeight:34,borderRadius:12,borderWidth:1,borderColor:'#343b42',paddingHorizontal:9},
  chipActive:{backgroundColor:'#d7bb84',borderColor:'#d7bb84'},
  chipText:{color:'#a4abb1',fontSize:8.5,fontWeight:'900'},
  chipTextActive:{color:'#17130d'},
  center:{alignItems:'center',justifyContent:'center'},
  contextGrid:{gap:7},
  contextBlock:{borderRadius:13,borderWidth:1,borderColor:'#292f35',backgroundColor:'#14181c',padding:9},
  contextLabel:{color:'#777f87',fontSize:7.5,fontWeight:'900',marginBottom:6},
  miniRow:{flexDirection:'row',flexWrap:'wrap',gap:5},
  miniChip:{minHeight:30,borderRadius:10,borderWidth:1,borderColor:'#30373e',paddingHorizontal:8},
  miniChipActive:{borderColor:'#76623f',backgroundColor:'#211c14'},
  miniText:{color:'#858d94',fontSize:7.5,fontWeight:'800'},
  miniTextActive:{color:'#e2c58b'},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:8,marginTop:15,marginBottom:7},
  sectionTitle:{flex:1,color:'#f0ece4',fontSize:13,fontWeight:'900'},
  count:{color:'#7d858c',fontSize:9,fontWeight:'900'},
  excluded:{color:'#8b716b',fontSize:8,lineHeight:12,marginBottom:7},
  card:{borderRadius:14,padding:12,backgroundColor:'#171b1f',borderWidth:1,borderColor:'#2c3238',marginBottom:7},
  cardTop:{flexDirection:'row',alignItems:'flex-start',gap:9},
  rank:{width:22,height:22,borderRadius:11,textAlign:'center',paddingTop:4,backgroundColor:'#262c32',color:'#d7bb84',fontSize:8,fontWeight:'900'},
  flex:{flex:1},
  cardMeta:{color:'#767e85',fontSize:8},
  cardTitle:{color:'#e7e4dd',fontSize:12,fontWeight:'900',marginTop:3},
  score:{color:'#99b29e',fontSize:8,fontWeight:'900'},
  decisionRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:8},
  decisionPrimary:{color:'#a9c6ad',fontSize:7.5,fontWeight:'900'},
  decisionSecondary:{color:'#899198',fontSize:7.5,fontWeight:'800'},
  tags:{flexDirection:'row',flexWrap:'wrap',gap:5,marginTop:7},
  tag:{color:'#a88e61',fontSize:7,fontWeight:'900'},
  goodTag:{color:'#91af98',fontSize:7,fontWeight:'900'},
  cautionTag:{color:'#c29b72',fontSize:7,fontWeight:'900'},
  fitNote:{color:'#717a81',fontSize:7.5,lineHeight:11,marginTop:6},
  sponsored:{borderColor:'#594b31',backgroundColor:'#17140f'},
  sponsoredLabel:{color:'#c7a563',fontSize:7,fontWeight:'900',letterSpacing:1,marginBottom:5},
  addToTrip:{minHeight:36,borderRadius:11,borderWidth:1,borderColor:'#4d432f',marginTop:9},
  addToTripText:{color:'#d7bb84',fontSize:8.5,fontWeight:'900'},
  guardrail:{color:'#666d74',fontSize:8,lineHeight:12,marginTop:10}
});
