import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { cityDiscoveryDemoCatalog } from '../../travel/cityDiscoveryDemoCatalog';
import {
  discoveryQuickFilters,
  rankCityDiscovery,
  type CityDiscoveryKind
} from '../../travel/cityDiscoveryEngine';

type Props = {
  language: AppLanguage;
  onAddToTrip: (itemId: string) => void;
};

type WindowFilter = 45 | 90 | 120 | 180;

const preferredKinds:CityDiscoveryKind[]=['museum','exhibition','theatre','restaurant','concert','park','bar','shopping','family'];

export default function CityExploreDemo({language,onAddToTrip}:Props){
  const [windowMinutes,setWindowMinutes]=useState<WindowFilter>(90);
  const [kind,setKind]=useState<CityDiscoveryKind | 'all'>('all');
  const [quick,setQuick]=useState<'fit'|'now'|'30'|'60'|'120'>('fit');

  const now='2026-10-07T17:10:00+03:00';
  const quickSets=useMemo(()=>discoveryQuickFilters(cityDiscoveryDemoCatalog,now),[]);

  const filtered=useMemo(()=>{
    let source=cityDiscoveryDemoCatalog;
    if(quick==='now') source=quickSets.openNow;
    if(quick==='30') source=quickSets.starts30;
    if(quick==='60') source=quickSets.starts60;
    if(quick==='120') source=quickSets.starts120;
    if(kind!=='all') source=source.filter(item=>item.kind===kind);
    return source;
  },[kind,quick,quickSets]);

  const ranked=useMemo(()=>rankCityDiscovery(filtered,{
    now,
    freeWindowMinutes:windowMinutes,
    preferredKinds:kind==='all'?preferredKinds:[kind],
    visitedIds:['demo-gorky-park'],
    currentDistrict:'Басманный'
  }),[filtered,kind,windowMinutes]);

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{tr(language,'EXPLORE MOSCOW · DEMO','EXPLORE MOSCOW · DEMO','探索莫斯科 · DEMO')}</Text>
      <Text style={styles.title}>
        {tr(language,'Что делать прямо сейчас?','What should I do now?','现在做什么？')}
      </Text>
      <Text style={styles.body}>
        {tr(
          language,
          'Ищем не просто популярное место, а лучший вариант под ваше реальное свободное окно, интересы и уже увиденную Москву.',
          'Find not just a popular place, but the best fit for your real free window, interests and what you have already seen.',
          '不只是找热门地点，而是根据你的真实空档、兴趣和已经体验过的莫斯科来匹配最合适的选择。'
        )}
      </Text>

      <Text style={styles.label}>{tr(language,'КОГДА','WHEN','时间')}</Text>
      <View style={styles.chips}>
        {[
          ['fit',tr(language,'Подходит в окно','Fits my window','适合空档')],
          ['now',tr(language,'Сейчас','Now','现在')],
          ['30',tr(language,'Через 30 мин','In 30 min','30分钟内')],
          ['60',tr(language,'Через 60 мин','In 60 min','60分钟内')],
          ['120',tr(language,'Через 2 часа','In 2 hours','2小时内')]
        ].map(([id,label])=>(
          <PhysicalPressable
            key={id}
            style={[styles.chip,quick===id&&styles.chipActive]}
            contentStyle={styles.center}
            onPress={()=>setQuick(id as typeof quick)}
          >
            <Text style={[styles.chipText,quick===id&&styles.chipTextActive]}>{label}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.label}>{tr(language,'СВОБОДНОЕ ВРЕМЯ','FREE WINDOW','空闲时间')}</Text>
      <View style={styles.chips}>
        {([45,90,120,180] as WindowFilter[]).map(value=>(
          <PhysicalPressable
            key={value}
            style={[styles.chip,windowMinutes===value&&styles.chipActive]}
            contentStyle={styles.center}
            onPress={()=>setWindowMinutes(value)}
          >
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
          <PhysicalPressable
            key={id}
            style={[styles.chip,kind===id&&styles.chipActive]}
            contentStyle={styles.center}
            onPress={()=>setKind(id as CityDiscoveryKind|'all')}
          >
            <Text style={[styles.chipText,kind===id&&styles.chipTextActive]}>{label}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{tr(language,'Лучшее по смыслу','Best organic matches','最佳自然推荐')}</Text>
        <Text style={styles.count}>{ranked.organic.length}</Text>
      </View>

      {ranked.organic.slice(0,5).map((item,index)=>(
        <View key={item.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.rank}>{index+1}</Text>
            <View style={styles.flex}>
              <Text style={styles.cardMeta}>{item.district} · {item.kind} · {item.durationMinutes} min</Text>
              <Text style={styles.cardTitle}>{language==='en'?item.titleEn:language==='zh'?item.titleZh:item.titleRu}</Text>
            </View>
            <Text style={styles.score}>{item.organicScore.toFixed(2)}</Text>
          </View>
          <View style={styles.tags}>
            {item.isNew && <Text style={styles.tag}>{tr(language,'НОВОЕ ДЛЯ МЕНЯ','NEW FOR ME','对我来说是新的')}</Text>}
            <Text style={styles.tag}>DEMO</Text>
            {item.startsInMinutes!==undefined && item.startsInMinutes>=0 && (
              <Text style={styles.tag}>{tr(language,`через ${item.startsInMinutes} мин`,`in ${item.startsInMinutes} min`,`${item.startsInMinutes}分钟后`)}</Text>
            )}
          </View>
          <PhysicalPressable
            style={styles.addToTrip}
            contentStyle={styles.center}
            accessibilityLabel={tr(language,`Добавить ${item.titleRu} в поездку`,`Add ${item.titleEn} to trip`,`将${item.titleZh}加入行程`)}
            onPress={()=>onAddToTrip(item.id)}
          >
            <Text style={styles.addToTripText}>{tr(language,'В поездку','Add to trip','加入行程')} →</Text>
          </PhysicalPressable>
        </View>
      ))}

      {ranked.sponsored.length>0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{tr(language,'Партнёрские предложения','Sponsored offers','赞助推荐')}</Text>
          </View>
          {ranked.sponsored.map(item=>(
            <View key={item.id} style={[styles.card,styles.sponsored]}>
              <Text style={styles.sponsoredLabel}>{tr(language,'РЕКЛАМА / ПАРТНЁР','SPONSORED','赞助')}</Text>
              <Text style={styles.cardTitle}>{language==='en'?item.titleEn:language==='zh'?item.titleZh:item.titleRu}</Text>
              <Text style={styles.cardMeta}>{item.district} · {item.durationMinutes} min</Text>
              <PhysicalPressable
                style={styles.addToTrip}
                contentStyle={styles.center}
                accessibilityLabel={tr(language,`Добавить ${item.titleRu} в поездку`,`Add ${item.titleEn} to trip`,`将${item.titleZh}加入行程`)}
                onPress={()=>onAddToTrip(item.id)}
              >
                <Text style={styles.addToTripText}>{tr(language,'В поездку','Add to trip','加入行程')} →</Text>
              </PhysicalPressable>
            </View>
          ))}
        </>
      )}

      <Text style={styles.guardrail}>
        {tr(
          language,
          'Organic ranking и paid placement разделены. Sponsored-предложение не может скрытно вытеснить лучший органический вариант.',
          'Organic ranking and paid placement are separate. A sponsored offer cannot silently displace the best organic result.',
          '自然排序与付费展示完全分离。赞助推荐不能暗中替代最佳自然结果。'
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
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:8,marginTop:15,marginBottom:7},
  sectionTitle:{flex:1,color:'#f0ece4',fontSize:13,fontWeight:'900'},
  count:{color:'#7d858c',fontSize:9,fontWeight:'900'},
  card:{borderRadius:14,padding:12,backgroundColor:'#171b1f',borderWidth:1,borderColor:'#2c3238',marginBottom:7},
  cardTop:{flexDirection:'row',alignItems:'flex-start',gap:9},
  rank:{width:22,height:22,borderRadius:11,textAlign:'center',paddingTop:4,backgroundColor:'#262c32',color:'#d7bb84',fontSize:8,fontWeight:'900'},
  flex:{flex:1},
  cardMeta:{color:'#767e85',fontSize:8},
  cardTitle:{color:'#e7e4dd',fontSize:12,fontWeight:'900',marginTop:3},
  score:{color:'#99b29e',fontSize:8,fontWeight:'900'},
  tags:{flexDirection:'row',flexWrap:'wrap',gap:5,marginTop:7},
  tag:{color:'#a88e61',fontSize:7,fontWeight:'900'},
  sponsored:{borderColor:'#594b31',backgroundColor:'#17140f'},
  sponsoredLabel:{color:'#c7a563',fontSize:7,fontWeight:'900',letterSpacing:1},
  addToTrip:{minHeight:36,borderRadius:11,borderWidth:1,borderColor:'#4d432f',marginTop:9},
  addToTripText:{color:'#d7bb84',fontSize:8.5,fontWeight:'900'},
  guardrail:{color:'#666d74',fontSize:8,lineHeight:12,marginTop:10}
});
