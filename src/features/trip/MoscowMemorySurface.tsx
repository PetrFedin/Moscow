import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { loadMoscowMemory } from '../../persistence/moscowMemoryStorage';
import { cityDiscoveryDemoCatalog } from '../../travel/cityDiscoveryDemoCatalog';
import { buildMoscowMemoryNext, type MoscowMemory } from '../../travel/moscowMemory';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { useMoscowTheme } from '../../theme/MoscowTheme';

type Props={
  language:AppLanguage;
  onAddDiscoveryToPlan:(itemId:string)=>void;
  onOpenPlan:()=>void;
  onOpenExplore:()=>void;
};

function itemTitle(language:AppLanguage,item:{titleRu:string;titleEn:string;titleZh:string}){
  return language==='en'?item.titleEn:language==='zh'?item.titleZh:item.titleRu;
}

export default function MoscowMemorySurface({
  language,
  onAddDiscoveryToPlan,
  onOpenPlan,
  onOpenExplore
}:Props){
  const { palette }=useMoscowTheme();
  const [memory,setMemory]=useState<MoscowMemory|null>(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    loadMoscowMemory()
      .then(setMemory)
      .catch(()=>setMemory(null))
      .finally(()=>setLoaded(true));
  },[]);

  const next=useMemo(
    ()=>memory?buildMoscowMemoryNext({
      memory,
      discoveryItemIds:cityDiscoveryDemoCatalog.map(item=>item.id),
      revisitLimit:4,
      unseenLimit:6
    }):null,
    [memory]
  );

  const unseen=useMemo(
    ()=>next?.unseenDiscoveryItemIds.flatMap(id=>{
      const item=cityDiscoveryDemoCatalog.find(candidate=>candidate.id===id);
      return item?[item]:[];
    })??[],
    [next]
  );

  if(!loaded) return null;

  if(!memory||memory.entries.length===0){
    return (
      <View style={[styles.hero,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <Text style={[styles.kicker,{color:palette.accentStrong}]}>
          {tr(language,'МОЯ МОСКВА','MY MOSCOW','我的莫斯科')}
        </Text>
        <Text style={[styles.title,{color:palette.text}]}>
          {tr(language,'Москва начнёт запоминаться здесь','Your Moscow memory starts here','你的莫斯科记忆从这里开始')}
        </Text>
        <Text style={[styles.body,{color:palette.textMuted}]}>
          {tr(
            language,
            'Отмечайте реальные посещения. История сохранится независимо от текущего плана и поможет в следующий раз повторить любимое или открыть новое.',
            'Record real visits. Your history stays independent of the current plan and helps you revisit favourites or discover something new next time.',
            '记录真实到访。历史记录独立于当前计划保存，之后可以重访喜欢的地点或发现新的体验。'
          )}
        </Text>
        <View style={styles.actions}>
          <PhysicalPressable style={[styles.primary,{backgroundColor:palette.accent}]} contentStyle={styles.center} strong onPress={onOpenPlan}>
            <Text style={[styles.primaryText,{color:palette.accentText}]}>{tr(language,'Создать план','Build a plan','创建计划')} →</Text>
          </PhysicalPressable>
          <PhysicalPressable style={[styles.secondary,{borderColor:palette.borderStrong}]} contentStyle={styles.center} onPress={onOpenExplore}>
            <Text style={[styles.secondaryText,{color:palette.accentStrong}]}>{tr(language,'Открыть Москву','Explore Moscow','探索莫斯科')}</Text>
          </PhysicalPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.hero,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <Text style={[styles.kicker,{color:palette.accentStrong}]}>{tr(language,'МОЯ МОСКВА','MY MOSCOW','我的莫斯科')}</Text>
        <Text style={[styles.title,{color:palette.text}]}>
          {tr(language,'То, что уже стало вашей Москвой','The Moscow you have already made yours','已经成为你的莫斯科')}
        </Text>
        <Text style={[styles.body,{color:palette.textMuted}]}>
          {tr(
            language,
            'История не зависит от одного плана: места остаются здесь после завершения дня, поездки или удаления текущего расписания.',
            'History is not tied to one plan: places stay here after a day, visit or current schedule is finished or cleared.',
            '历史不依赖某一个计划：一天结束、一次到访结束或当前安排被清除后，这些地点仍会保留。'
          )}
        </Text>

        <View style={styles.metrics}>
          <View style={[styles.metric,{backgroundColor:palette.surfaceSoft}]}>
            <Text style={[styles.metricValue,{color:palette.text}]}>{memory.entries.length}</Text>
            <Text style={[styles.metricLabel,{color:palette.textSoft}]}>{tr(language,'мест','places','地点')}</Text>
          </View>
          <View style={[styles.metric,{backgroundColor:palette.surfaceSoft}]}>
            <Text style={[styles.metricValue,{color:palette.text}]}>
              {memory.entries.reduce((sum,entry)=>sum+entry.visitCount,0)}
            </Text>
            <Text style={[styles.metricLabel,{color:palette.textSoft}]}>{tr(language,'посещений','visits','到访')}</Text>
          </View>
          <View style={[styles.metric,{backgroundColor:palette.surfaceSoft}]}>
            <Text style={[styles.metricValue,{color:palette.text}]}>
              {memory.entries.filter(entry=>entry.visitCount>1).length}
            </Text>
            <Text style={[styles.metricLabel,{color:palette.textSoft}]}>{tr(language,'повторяли','revisited','重访')}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle,{color:palette.text}]}>{tr(language,'История посещений','Visit history','到访历史')}</Text>
      <View style={styles.list}>
        {memory.entries.slice(0,12).map(entry=>(
          <View key={entry.id} style={[styles.memoryCard,{backgroundColor:palette.surfaceRaised,borderColor:palette.border}]}>
            <View style={styles.memoryCopy}>
              <Text style={[styles.memoryTitle,{color:palette.text}]}>{entry.title}</Text>
              <Text style={[styles.memoryMeta,{color:palette.textSoft}]}>
                {entry.kind} · {entry.lastVisitedAt.slice(0,10)}
                {entry.visitCount>1?tr(language,` · ${entry.visitCount} раза`,` · ${entry.visitCount} visits`,` · ${entry.visitCount}次`):''}
              </Text>
            </View>
            {entry.discoveryItemId&&(
              <PhysicalPressable
                style={[styles.smallAction,{borderColor:palette.borderStrong}]}
                contentStyle={styles.center}
                onPress={()=>onAddDiscoveryToPlan(entry.discoveryItemId!)}
              >
                <Text style={[styles.smallActionText,{color:palette.accentStrong}]}>{tr(language,'Повторить','Revisit','再次去')}</Text>
              </PhysicalPressable>
            )}
          </View>
        ))}
      </View>

      {next&&next.revisit.length>0&&(
        <View style={[styles.sectionCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
          <Text style={[styles.kicker,{color:palette.accentStrong}]}>{tr(language,'МОЖНО ПОВТОРИТЬ','REVISIT','可以重访')}</Text>
          <Text style={[styles.sectionLead,{color:palette.text}]}>
            {tr(language,'Любимые и повторные места','Places worth returning to','值得再次去的地方')}
          </Text>
          <Text style={[styles.body,{color:palette.textMuted}]}>
            {tr(language,'Повтор — это нормальный сценарий, а не ошибка рекомендаций.','Revisiting is a valid choice, not a recommendation failure.','重访是正常选择，不是推荐系统的错误。')}
          </Text>
        </View>
      )}

      {unseen.length>0&&(
        <View style={[styles.sectionCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
          <Text style={[styles.kicker,{color:palette.accentStrong}]}>{tr(language,'НОВОЕ ДЛЯ МЕНЯ','NEW FOR ME','对我来说是新的')}</Text>
          <Text style={[styles.sectionLead,{color:palette.text}]}>
            {tr(language,'Следующая Москва','Your next Moscow','下一次莫斯科')}
          </Text>
          <Text style={[styles.body,{color:palette.textMuted}]}>
            {tr(
              language,
              'Система отделяет уже увиденное от нового и предлагает идеи для следующего дня или следующего приезда.',
              'The system separates what you have already seen from what is still new for your next day or next visit.',
              '系统会区分你已经看过的内容和仍然新鲜的内容，用于下一天或下一次到访。'
            )}
          </Text>
          <View style={styles.nextList}>
            {unseen.slice(0,4).map(item=>(
              <View key={item.id} style={[styles.nextRow,{borderTopColor:palette.border}]}>
                <View style={styles.memoryCopy}>
                  <Text style={[styles.memoryTitle,{color:palette.text}]}>{itemTitle(language,item)}</Text>
                  <Text style={[styles.memoryMeta,{color:palette.textSoft}]}>{item.district} · {item.kind}</Text>
                </View>
                <PhysicalPressable
                  style={[styles.smallAction,{borderColor:palette.borderStrong}]}
                  contentStyle={styles.center}
                  onPress={()=>onAddDiscoveryToPlan(item.id)}
                >
                  <Text style={[styles.smallActionText,{color:palette.accentStrong}]}>{tr(language,'В план','Add','加入计划')}</Text>
                </PhysicalPressable>
              </View>
            ))}
          </View>
          <PhysicalPressable style={[styles.secondary,{borderColor:palette.borderStrong}]} contentStyle={styles.center} onPress={onOpenExplore}>
            <Text style={[styles.secondaryText,{color:palette.accentStrong}]}>{tr(language,'Показать больше нового','Explore more new places','查看更多新地点')} →</Text>
          </PhysicalPressable>
        </View>
      )}
    </View>
  );
}

const styles=StyleSheet.create({
  root:{gap:14,marginBottom:20},
  hero:{borderRadius:24,borderWidth:1,padding:18},
  kicker:{fontSize:8,fontWeight:'900',letterSpacing:1.2},
  title:{fontSize:22,lineHeight:28,fontWeight:'900',marginTop:6},
  body:{fontSize:10.5,lineHeight:16,marginTop:7},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},
  primary:{minHeight:46,borderRadius:14,flexGrow:1},
  primaryText:{fontSize:10,fontWeight:'900'},
  secondary:{minHeight:44,borderRadius:14,borderWidth:1,flexGrow:1,marginTop:10},
  secondaryText:{fontSize:9,fontWeight:'900'},
  center:{alignItems:'center',justifyContent:'center',paddingHorizontal:12},
  metrics:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:14},
  metric:{minWidth:92,flexGrow:1,borderRadius:14,padding:11},
  metricValue:{fontSize:19,fontWeight:'900'},
  metricLabel:{fontSize:8,marginTop:2},
  sectionTitle:{fontSize:16,fontWeight:'900'},
  list:{gap:7},
  memoryCard:{borderRadius:15,borderWidth:1,padding:11,flexDirection:'row',alignItems:'center',gap:8},
  memoryCopy:{flex:1,minWidth:0},
  memoryTitle:{fontSize:11,fontWeight:'900'},
  memoryMeta:{fontSize:8,lineHeight:11,marginTop:3},
  smallAction:{minHeight:34,borderRadius:11,borderWidth:1,paddingHorizontal:9},
  smallActionText:{fontSize:8,fontWeight:'900'},
  sectionCard:{borderRadius:20,borderWidth:1,padding:15},
  sectionLead:{fontSize:17,fontWeight:'900',marginTop:5},
  nextList:{marginTop:10},
  nextRow:{minHeight:52,borderTopWidth:1,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:8}
});
