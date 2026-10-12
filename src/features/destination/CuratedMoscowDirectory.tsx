import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { curatedMoscowPlaces, type CuratedMoscowCategory, type CuratedMoscowPlace } from '../../travel/curatedMoscowPlaces';
import PhysicalPressable from '../../ui/PhysicalPressable';

export default function CuratedMoscowDirectory({language,onRequestAdd}:{language:AppLanguage;onRequestAdd:(place:CuratedMoscowPlace)=>void}){
 const [selected,setSelected]=useState<string|null>(null);
 const [category,setCategory]=useState<'all'|CuratedMoscowCategory>('all');
 const filteredPlaces=curatedMoscowPlaces.filter(place=>category==='all'||place.kind===category);
 return <View style={styles.root}>
  <Text style={styles.kicker}>{tr(language,'МОСКВА · ПЕРВЫЕ МЕСТА','MOSCOW · PLACES','莫斯科 · 景点')}</Text>
  <Text style={styles.title}>{tr(language,'Найдите повод выйти в город','Discover a place worth visiting','探索莫斯科')}</Text>
  <Text style={styles.note}>{tr(language,'Официальные источники; актуальные часы, билеты и доступность пока не проверены.','Official sources. Current hours, tickets and availability not verified.','官方信息来源；当前营业时间与门票尚未验证。')}</Text>
  <View style={styles.filters}>
    {([
      ['all', tr(language,'Все места','All places','全部地点')],
      ['museum', tr(language,'Музеи','Museums','博物馆')],
      ['theatre', tr(language,'Театры','Theatres','剧院')],
      ['park', tr(language,'Парки','Parks','公园')],
      ['restaurant', tr(language,'Рестораны','Restaurants','餐厅')]
    ] as const).map(([key,label])=>(
      <PhysicalPressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: category === key }}
        style={[styles.filter,category===key&&styles.filterSelected]}
        contentStyle={styles.filterInner}
        onPress={()=>{setCategory(key);setSelected(null);}}
      ><Text style={[styles.filterText,category===key&&styles.filterTextSelected]}>{label}</Text></PhysicalPressable>
    ))}
  </View>
  {filteredPlaces.map(place=><View key={place.id} style={styles.card}>
   <PhysicalPressable accessibilityRole="button" accessibilityLabel={place.titleRu} style={styles.header} contentStyle={styles.inner} onPress={()=>setSelected(selected===place.id?null:place.id)}>
    <View style={styles.copy}>
     <Text style={styles.category}>{place.kind.toUpperCase()} · {place.districtRu}</Text>
     <Text style={styles.name}>{language==='ru'?place.titleRu:place.titleEn}</Text>
     <Text style={styles.address}>{place.addressRu}</Text>
    </View><Text style={styles.arrow}>{selected===place.id?'−':'＋'}</Text>
   </PhysicalPressable>
   {selected===place.id&&<View style={styles.details}>
    <Text style={styles.note}>{place.descriptionRu}</Text>
    <Text style={styles.proof}>{tr(language,'Адрес проверен по источнику','Address source checked','地址来源已核对')}: {place.addressCheckedAt}</Text>
    <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Проверить официальный сайт','Open official source','打开官方网站')} style={styles.link} contentStyle={styles.linkInner} onPress={()=>{void Linking.openURL(place.officialUrl).catch(()=>undefined);}}>
      <Text style={styles.linkText}>{tr(language,'Официальный сайт ↗','Official website ↗','官方网站 ↗')}</Text>
    </PhysicalPressable>
    <PhysicalPressable
      accessibilityRole="button"
      accessibilityLabel={tr(language,'Найти адрес на карте','Find address on map','在地图中查找地址')}
      style={styles.link} contentStyle={styles.linkInner}
      onPress={()=>{void Linking.openURL('https://yandex.ru/maps/?text='+encodeURIComponent('Москва, '+place.addressRu)).catch(()=>undefined);}}
    ><Text style={styles.linkText}>{tr(language,'Найти адрес на карте','Find address on map','在地图中查找地址')} ↗</Text></PhysicalPressable>
    <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Добавить место в поездку','Add place to trip','添加到行程')} style={styles.action} contentStyle={styles.linkInner} onPress={()=>onRequestAdd(place)}>
      <Text style={styles.actionText}>{tr(language,'Выбрать для поездки →','Choose for my trip →','添加到行程 →')}</Text>
    </PhysicalPressable>
   </View>}
  </View>)}
 </View>;
}
const styles=StyleSheet.create({
root:{marginTop:23,marginBottom:25},
filters:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:12,marginBottom:5},
filter:{minHeight:44,borderRadius:12,borderWidth:1,borderColor:'#647367'},
filterSelected:{backgroundColor:'#ddcda9',borderColor:'#ddcda9'},
filterInner:{paddingHorizontal:13,alignItems:'center',justifyContent:'center'},
filterText:{color:'#dfebdd',fontSize:12,fontWeight:'700'},
filterTextSelected:{color:'#26372b'},
proof:{color:'#aab9ad',fontSize:11,marginTop:9},
kicker:{color:'#d5b783',fontSize:11,letterSpacing:1,fontWeight:'700'},
title:{color:'#f8f3e7',fontSize:24,lineHeight:30,fontWeight:'700',marginTop:8,marginBottom:10},
note:{color:'#c1c9bf',fontSize:13,lineHeight:19,marginTop:7},card:{marginTop:11,backgroundColor:'#202d27',borderRadius:18,borderWidth:1,borderColor:'#405246'},
header:{minHeight:77},inner:{padding:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
copy:{flex:1,minWidth:0},category:{color:'#bdaa80',fontSize:10,letterSpacing:0.5},name:{color:'#fff3df',fontSize:17,fontWeight:'700',marginTop:6},
address:{color:'#b7c7ba',fontSize:12,marginTop:5},arrow:{color:'#e4c796',fontSize:20,marginHorizontal:10},
details:{paddingHorizontal:14,paddingBottom:15},link:{minHeight:46,borderRadius:12,borderWidth:1,borderColor:'#77917e',marginTop:10},
linkInner:{alignItems:'center',justifyContent:'center',paddingHorizontal:12},linkText:{color:'#e7d7b8',fontSize:13,fontWeight:'700'},
action:{minHeight:49,borderRadius:12,backgroundColor:'#e7d7b8',marginTop:9},actionText:{color:'#23372c',fontSize:13,fontWeight:'700'}
});
