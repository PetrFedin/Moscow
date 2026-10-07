import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { cityPulseDemoLoads, cityPulseDemoOpportunities } from '../../travel/cityPulseDemo';

export default function CityPulseDemo({language}:{language:AppLanguage}) {
  const [index,setIndex]=useState(0);
  const item=cityPulseDemoOpportunities[index]!;
  const title=language==='en'?item.titleEn:language==='zh'?item.titleZh:item.titleRu;
  const reason=language==='en'?item.reasonEn:language==='zh'?item.reasonZh:item.reasonRu;

  const loadLabel=useMemo(()=>({
    popular:tr(language,'Популярно','Popular','热门'),
    balanced:tr(language,'Сбалансировано','Balanced','均衡'),
    underused:tr(language,'Есть запас','Opportunity','有空间')
  }[item.loadState]),[item.loadState,language]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>{tr(language,'CITY PULSE · DEMO','CITY PULSE · DEMO','CITY PULSE · DEMO')}</Text>
          <Text style={styles.title}>{tr(language,'Город подсказывает не только куда, но и когда','The city suggests not only where, but when','城市不仅告诉你去哪，也告诉你何时去')}</Text>
        </View>
        <View style={styles.demoBadge}><Text style={styles.demoText}>DEMO</Text></View>
      </View>

      <Text style={styles.body}>
        {tr(
          language,
          'Рекомендация учитывает ваш день и одновременно помогает раскрывать районы, события и качественное предложение за пределами самых очевидных точек. Нужное вам место никогда не скрывается.',
          'Recommendations fit your day while helping reveal districts, events and quality supply beyond the most obvious hotspots. A destination you explicitly want is never hidden.',
          '推荐既适配你的行程，也帮助发现热门核心区之外的城区、活动和优质供给。你明确想去的地点永远不会被隐藏。'
        )}
      </Text>

      <View style={styles.loadRow}>
        {cityPulseDemoLoads.map((load)=>(
          <View key={load.district} style={styles.loadCard}>
            <Text style={styles.loadDistrict}>{load.district}</Text>
            <Text style={styles.loadNote}>{language==='en'?load.noteEn:language==='zh'?load.noteZh:load.noteRu}</Text>
          </View>
        ))}
      </View>

      <View style={styles.opportunity}>
        <View style={styles.opTop}>
          <View style={styles.flex}>
            <Text style={styles.opDistrict}>{item.district} · {item.fit}</Text>
            <Text style={styles.opTitle}>{title}</Text>
          </View>
          <View style={styles.state}><Text style={styles.stateText}>{loadLabel}</Text></View>
        </View>
        <Text style={styles.reason}>{reason}</Text>

        <View style={styles.valueGrid}>
          <Value
            label={tr(language,'ТУРИСТ','TRAVELER','游客')}
            text={tr(language,'Меньше лишних переездов, больше подходящего опыта в свободное время.','Less backtracking, more relevant experiences in free time.','减少无效移动，把空闲时间用在更合适的体验上。')}
          />
          <Value
            label={tr(language,'ПАРТНЁР','PARTNER','合作伙伴')}
            text={language==='ru'?item.partnerValueRu:tr(language,item.partnerValueRu,'Qualified contextual demand instead of generic reach.','获得有场景的高质量需求，而不是泛流量。')}
          />
          <Value
            label={tr(language,'ГОРОД','CITY','城市')}
            text={language==='ru'?item.cityValueRu:tr(language,item.cityValueRu,'Demand is distributed through relevance rather than administrative restriction.','通过相关性分配需求，而不是行政限制。')}
          />
        </View>
      </View>

      <View style={styles.pager}>
        {cityPulseDemoOpportunities.map((candidate,i)=>(
          <PhysicalPressable
            key={candidate.id}
            accessibilityRole="button"
            accessibilityLabel={`${i+1}`}
            style={[styles.dot,i===index&&styles.dotActive]}
            contentStyle={styles.center}
            onPress={()=>setIndex(i)}
          >
            <Text style={[styles.dotText,i===index&&styles.dotTextActive]}>{i+1}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.guardrail}>
        {tr(
          language,
          'DEMO: показатели нагрузки и availability здесь синтетические. В production они появляются только из согласованных агрегированных и provider-источников; paid sponsorship не меняет organic ranking.',
          'DEMO: load and availability values here are synthetic. In production they require authorised aggregate/provider sources; paid sponsorship never changes organic ranking.',
          'DEMO：这里的客流与可用性数据为合成演示。正式环境只使用授权的聚合/服务商数据；付费赞助不会改变自然排序。'
        )}
      </Text>
    </View>
  );
}

function Value({label,text}:{label:string;text:string}) {
  return <View style={styles.value}><Text style={styles.valueLabel}>{label}</Text><Text style={styles.valueText}>{text}</Text></View>;
}

const styles=StyleSheet.create({
  root:{borderRadius:22,padding:17,backgroundColor:'#101316',borderWidth:1,borderColor:'#2d3339',marginBottom:20},
  header:{flexDirection:'row',gap:10,alignItems:'flex-start'},
  flex:{flex:1},
  kicker:{color:'#b99b69',fontSize:8,letterSpacing:1.2,fontWeight:'900'},
  title:{color:'#f5efe4',fontSize:19,lineHeight:24,fontWeight:'900',marginTop:5},
  demoBadge:{borderRadius:9,paddingHorizontal:8,paddingVertical:5,backgroundColor:'#28231a'},
  demoText:{color:'#d7bb84',fontSize:7,fontWeight:'900'},
  body:{color:'#939aa1',fontSize:10.5,lineHeight:16,marginTop:8},
  loadRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:12},
  loadCard:{minWidth:145,flexBasis:'47%',flexGrow:1,padding:10,borderRadius:12,backgroundColor:'#171b1f'},
  loadDistrict:{color:'#d5d9dd',fontSize:9,fontWeight:'900'},
  loadNote:{color:'#777e85',fontSize:8,lineHeight:12,marginTop:3},
  opportunity:{marginTop:10,padding:13,borderRadius:15,backgroundColor:'#15191d',borderWidth:1,borderColor:'#343a40'},
  opTop:{flexDirection:'row',gap:8,alignItems:'flex-start'},
  opDistrict:{color:'#a48b60',fontSize:8,fontWeight:'900'},
  opTitle:{color:'#f0ece4',fontSize:15,fontWeight:'900',marginTop:4},
  state:{borderRadius:9,paddingHorizontal:8,paddingVertical:5,backgroundColor:'#1e271f'},
  stateText:{color:'#a9c2ad',fontSize:7,fontWeight:'900'},
  reason:{color:'#aab0b6',fontSize:10,lineHeight:15,marginTop:8},
  valueGrid:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},
  value:{minWidth:150,flexBasis:'31%',flexGrow:1,padding:9,borderRadius:11,backgroundColor:'#111417'},
  valueLabel:{color:'#b99b69',fontSize:7,fontWeight:'900'},
  valueText:{color:'#8f969d',fontSize:8.5,lineHeight:13,marginTop:3},
  pager:{flexDirection:'row',gap:6,marginTop:10},
  dot:{width:28,height:28,borderRadius:14,borderWidth:1,borderColor:'#333941'},
  dotActive:{backgroundColor:'#d7bb84',borderColor:'#d7bb84'},
  dotText:{color:'#8d949a',fontSize:8,fontWeight:'900'},
  dotTextActive:{color:'#17130d'},
  center:{alignItems:'center',justifyContent:'center'},
  guardrail:{color:'#666d74',fontSize:8,lineHeight:12,marginTop:10}
});
