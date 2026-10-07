import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { useMoscowTheme } from '../../theme/MoscowTheme';

type Props = {
  language: AppLanguage;
  onOpenTrip: () => void;
  onOpenNearby: () => void;
  onOpenMap: () => void;
};

const categories = {
  ru: ['Музеи','События','Театры','Еда','Бары','Парки','Архитектура','Покупки','Детям','Ночная Москва'],
  en: ['Museums','Events','Theatre','Food','Bars','Parks','Architecture','Shopping','Family','Night Moscow'],
  zh: ['博物馆','活动','剧院','美食','酒吧','公园','建筑','购物','亲子','夜游莫斯科']
} as const;

export default function CityTripOverview({ language, onOpenTrip, onOpenNearby, onOpenMap }: Props) {
  const { palette } = useMoscowTheme();
  const items = categories[language];

  return (
    <View style={styles.root}>
      <View style={[styles.hero,{backgroundColor:palette.surfaceRaised,borderColor:palette.borderStrong}]}>
        <Text style={styles.kicker}>
          {tr(language,'МОСКВА · CITY TRIP OS','MOSCOW · CITY TRIP OS','莫斯科 · CITY TRIP OS')}
        </Text>
        <Text style={[styles.title,{color:palette.text}]}>
          {tr(
            language,
            'Планируйте Москву. Помните, где были. Каждый раз открывайте новое.',
            'Plan Moscow. Remember where you have been. Discover something new every time.',
            '规划莫斯科，记住去过的地方，每次都发现新的体验。'
          )}
        </Text>
        <Text style={[styles.body,{color:palette.textMuted}]}>
          {tr(
            language,
            'Составьте план на день или несколько дней, добавьте свои билеты и брони. Moscow запомнит, где вы были и что видели, а затем поможет повторить любимое или собрать новый маршрут.',
            'Build a plan for one day or several days and add your tickets and reservations. Moscow remembers what you saw and where you went, then helps you revisit favourites or build a new route.',
            '规划一天或多天，加入自己的门票和预订。Moscow 会记住你去过和看过的地方，之后帮助你重访喜欢的地点或创建新的路线。'
          )}
        </Text>

        <View style={styles.actions}>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language,'Создать план','Build a plan','创建计划')}
            style={[styles.primary,{backgroundColor:palette.accent}]}
            contentStyle={styles.center}
            strong
            onPress={onOpenTrip}
          >
            <Text style={[styles.primaryText,{color:palette.accentText}]}>
              {tr(language,'Создать план','Build a plan','创建计划')} →
            </Text>
          </PhysicalPressable>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language,'Что рядом сейчас','What is nearby now','查看附近')}
            style={[styles.secondary,{borderColor:palette.borderStrong}]}
            contentStyle={styles.center}
            onPress={onOpenNearby}
          >
            <Text style={[styles.secondaryText,{color:palette.accentStrong}]}>
              {tr(language,'Что рядом сейчас','What is nearby now','查看附近')}
            </Text>
          </PhysicalPressable>
        </View>
      </View>

      <View style={styles.stageGrid}>
        <Stage
          label={tr(language,'ДО ПОЕЗДКИ','BEFORE','出发前')}
          title={tr(language,'Собрать дни','Build the trip','规划行程')}
          text={tr(language,'Даты · интересы · темп · must-see · свои билеты','Dates · interests · pace · must-see · your tickets','日期 · 兴趣 · 节奏 · 必看 · 自有门票')}
        />
        <Stage
          label={tr(language,'СЕГОДНЯ','TODAY','今天')}
          title={tr(language,'Исполнить день','Execute the day','执行今日')}
          text={tr(language,'Фиксированные планы · свободные окна · еда · события','Fixed plans · free windows · food · events','固定计划 · 空闲时段 · 美食 · 活动')}
        />
        <Stage
          label={tr(language,'В ГОРОДЕ','LIVE CITY','城市中')}
          title={tr(language,'Подстроиться','Adapt live','动态调整')}
          text={tr(language,'Рядом · изменения · альтернативы · новый район','Nearby · changes · alternatives · another district','附近 · 变化 · 替代方案 · 新城区')}
        />
        <Stage
          label={tr(language,'ПОСЛЕ','AFTER','之后')}
          title={tr(language,'Моя Москва','My Moscow','我的莫斯科')}
          text={tr(language,'Где был · что видел · где ел · что ещё открыть','Where you went · saw · ate · what remains','去过哪里 · 看过什么 · 吃过什么 · 还有什么')}
        />
      </View>

      <View style={[styles.categoriesCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <View style={styles.sectionTop}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>
              {tr(language,'ЧЕМ ЗАНЯТЬ ДЕНЬ','BUILD YOUR MOSCOW','玩转莫斯科')}
            </Text>
            <Text style={[styles.sectionTitle,{color:palette.text}]}>
              {tr(language,'Не только достопримечательности','More than attractions','不只是景点')}
            </Text>
          </View>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language,'Открыть карту','Open map','打开地图')}
            style={[styles.mapButton,{borderColor:palette.borderStrong}]}
            contentStyle={styles.center}
            onPress={onOpenMap}
          >
            <Text style={[styles.mapText,{color:palette.accentStrong}]}>{tr(language,'Карта','Map','地图')} →</Text>
          </PhysicalPressable>
        </View>

        <View style={styles.chips}>
          {items.map((item) => (
            <View key={item} style={[styles.chip,{backgroundColor:palette.surfaceSoft,borderColor:palette.border}]}>
              <Text style={[styles.chipText,{color:palette.textMuted}]}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.note,{color:palette.textSoft}]}>
          {tr(
            language,
            'MVP показывает широкую модель города. Live availability, цены и provider confirmation появляются только через согласованные источники; demo-контент маркируется отдельно.',
            'The MVP shows the broad city model. Live availability, prices and provider confirmation appear only through authorised sources; demo content is labelled separately.',
            'MVP 展示完整城市产品模型。实时库存、价格与服务商确认仅来自授权数据源；演示内容会明确标注。'
          )}
        </Text>
      </View>
    </View>
  );
}

function Stage({label,title,text}:{label:string;title:string;text:string}) {
  const { palette } = useMoscowTheme();
  return (
    <View style={[styles.stage,{backgroundColor:palette.surface,borderColor:palette.border}]}>
      <Text style={[styles.stageLabel,{color:palette.textSoft}]}>{label}</Text>
      <Text style={[styles.stageTitle,{color:palette.text}]}>{title}</Text>
      <Text style={[styles.stageText,{color:palette.textMuted}]}>{text}</Text>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{gap:12,marginBottom:22},
  hero:{borderRadius:27,padding:22,backgroundColor:'#15191e',borderWidth:1,borderColor:'#3a3427'},
  kicker:{color:'#b99b69',fontSize:9,letterSpacing:1.4,fontWeight:'900'},
  title:{color:'#fff8ea',fontSize:28,lineHeight:34,fontWeight:'900',marginTop:7},
  body:{color:'#acb0b7',fontSize:13,lineHeight:20,marginTop:9},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},
  primary:{minHeight:48,borderRadius:15,backgroundColor:'#d7bb84',flexGrow:1},
  primaryText:{color:'#17130d',fontSize:11,fontWeight:'900'},
  secondary:{minHeight:48,borderRadius:15,borderWidth:1,borderColor:'#454b53',flexGrow:1},
  secondaryText:{color:'#e0c793',fontSize:11,fontWeight:'900'},
  center:{alignItems:'center',justifyContent:'center',paddingHorizontal:12},
  stageGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  stage:{minWidth:150,flexBasis:'47%',flexGrow:1,borderRadius:16,padding:13,backgroundColor:'#111417',borderWidth:1,borderColor:'#292e34'},
  stageLabel:{color:'#7d838a',fontSize:7,fontWeight:'900',letterSpacing:1.1},
  stageTitle:{color:'#f1ece3',fontSize:14,fontWeight:'900',marginTop:5},
  stageText:{color:'#969ca3',fontSize:9.5,lineHeight:14,marginTop:4},
  categoriesCard:{borderRadius:22,padding:17,backgroundColor:'#101316',borderWidth:1,borderColor:'#2b3036'},
  sectionTop:{flexDirection:'row',gap:10,alignItems:'center'},
  flex:{flex:1},
  sectionTitle:{color:'#f4efe6',fontSize:18,fontWeight:'900',marginTop:5},
  mapButton:{minHeight:38,borderRadius:12,borderWidth:1,borderColor:'#3b4249'},
  mapText:{color:'#d7bb84',fontSize:9,fontWeight:'900'},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:12},
  chip:{borderRadius:999,paddingHorizontal:10,paddingVertical:7,backgroundColor:'#191d21',borderWidth:1,borderColor:'#30363d'},
  chipText:{color:'#c6cbd0',fontSize:9,fontWeight:'800'},
  note:{color:'#737980',fontSize:8.5,lineHeight:13,marginTop:12}
});
