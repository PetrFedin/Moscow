import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { places } from '../../data/places';
import { localizePlaces } from '../../data/places.en';
import { buildTouristRoutePlan, type TouristInterest, type TouristRoutePlan, type TouristTimeBudget } from '../planning/touristPlanner';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  language: AppLanguage;
  savedIds: string[];
  onStartWalk: (plan: TouristRoutePlan) => void;
};

const options: { key: TouristInterest; minutes: TouristTimeBudget; icon: string; names: [string,string,string] }[] = [
  {key:'highlights',minutes:30,icon:'✦',names:['Главное за полчаса','Highlights in 30 min','30分钟精选']},
  {key:'architecture',minutes:45,icon:'⌂',names:['Архитектурная прогулка','Architecture walk','建筑漫步']},
  {key:'trade',minutes:30,icon:'◈',names:['Купеческая Москва','Merchant Moscow','商贸莫斯科']},
  {key:'lost-city',minutes:15,icon:'◇',names:['Следы прошлого','Traces of the past','过去的印记']}
];

export default function MoscowMomentFinder({ language, savedIds, onStartWalk }: Props) {
  const [selected, setSelected] = useState<TouristInterest | null>(null);
  const [confirmChange, setConfirmChange] = useState(false);
  const selectedOption = options.find(item=>item.key===selected);
  const localized = useMemo(()=>localizePlaces(places,language),[language]);
  const byId = useMemo(()=>new Map(localized.map(place=>[place.id,place.title])),[localized]);
  const plan = useMemo(()=>selectedOption
    ? buildTouristRoutePlan(selectedOption.minutes,selectedOption.key,places,savedIds)
    : null,[selectedOption,savedIds]);
  const name = (item: typeof options[number]) => item.names[language==='ru'?0:language==='en'?1:2];
  return <View style={styles.root}>
    <Text style={styles.kicker}>{tr(language,'ПРОГУЛКА ПОД ВАШЕ НАСТРОЕНИЕ','A WALK FOR YOUR MOOD','按心情漫步')}</Text>
    <Text style={styles.title}>{tr(language,'Чем займёмся прямо сейчас?','What shall we explore?','现在探索什么？')}</Text>
    <Text style={styles.intro}>{tr(language,'Реальные исторические места Варварки и Зарядья — без вымышленных билетов и часов работы.','Source-backed historic places in Varvarka and Zaryadye. No invented tickets or opening hours.','探索有来源的瓦尔瓦尔卡与扎里亚季耶历史景点。')}</Text>
    <View style={styles.grid}>{options.map(item=><PhysicalPressable
      key={item.key}
      accessibilityRole="button"
      accessibilityLabel={name(item)}
      style={[styles.option,selected===item.key&&styles.selected]}
      contentStyle={styles.optionInner}
      onPress={()=>{setSelected(item.key);setConfirmChange(false);}}
    ><Text style={styles.symbol}>{item.icon}</Text><Text style={styles.optionTitle}>{name(item)}</Text><Text style={styles.duration}>{item.minutes} {tr(language,'мин','min','分钟')}</Text></PhysicalPressable>)}</View>
    {plan && selectedOption && <View style={styles.preview}>
      <Text style={styles.previewTitle}>{name(selectedOption)}</Text>
      {plan.stopIds.map((id,index)=><Text key={id} style={styles.stop}>{index+1}. {byId.get(id)??id}</Text>)}
      <Text style={styles.notice}>{tr(language,'≈','≈','约')}{plan.estimatedMinutes} {tr(language,'мин · редакционная оценка, не подтверждённая навигация','min · editorial estimate, not verified routing','分钟 · 编辑估算，非实时导航')}</Text>
      {confirmChange && <Text style={styles.notice}>{tr(language,'Новая прогулка заменит текущую активную прогулку, если она есть. Ваши билеты в поездке не меняются.','This replaces an active walk, if any. Your trip tickets remain untouched.','如已有步行路线，新路线将取代它。门票不变。')}</Text>}
      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={confirmChange?tr(language,'Подтвердить запуск прогулки','Confirm start walk','确认开始步行'):tr(language,'Выбрать эту прогулку','Choose this walk','选择这条路线')}
        style={styles.action}
        contentStyle={styles.actionContent}
        onPress={()=>{if(!confirmChange){setConfirmChange(true);return;}onStartWalk(plan);setConfirmChange(false);}}
      ><Text style={styles.actionText}>{confirmChange?tr(language,'Начать прогулку','Start walk','开始步行'):tr(language,'Посмотреть и выбрать','Review and choose','查看并选择')} →</Text></PhysicalPressable>
    </View>}
  </View>;
}
const styles=StyleSheet.create({
  root:{marginTop:16,marginBottom:14},
  kicker:{fontSize:10,color:'#bda57a',fontWeight:'700',letterSpacing:1.1},
  title:{fontSize:24,color:'#f7f1e5',fontWeight:'700',marginTop:7},
  intro:{fontSize:13,lineHeight:19,color:'#acb9b0',marginTop:8,marginBottom:14},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  option:{width:'47%',minHeight:138,borderRadius:18,backgroundColor:'#22372e',borderWidth:1,borderColor:'#405349',flexGrow:1},
  selected:{borderColor:'#e5c48e',backgroundColor:'#364937'},
  optionInner:{padding:15,justifyContent:'space-between',alignItems:'flex-start',flex:1},
  symbol:{fontSize:23,color:'#ebd19f'},optionTitle:{fontSize:15,lineHeight:20,color:'#faf3e6',fontWeight:'700'},duration:{fontSize:11,color:'#c1d0c3'},
  preview:{borderRadius:18,borderWidth:1,borderColor:'#52694f',backgroundColor:'#26362f',padding:17,marginTop:12},
  previewTitle:{color:'#fff4dd',fontSize:18,fontWeight:'700',marginBottom:9},
  stop:{color:'#e4ebe2',fontSize:12,marginTop:5},
  notice:{color:'#c5d1c5',fontSize:11,lineHeight:17,marginTop:12},
  action:{backgroundColor:'#e7d7b7',borderRadius:13,minHeight:48,marginTop:15},
  actionContent:{paddingHorizontal:16,alignItems:'center',justifyContent:'center'},
  actionText:{color:'#23342b',fontSize:14,fontWeight:'700'}
});
