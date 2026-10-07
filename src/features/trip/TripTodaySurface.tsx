import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { loadPersonalTrip } from '../../persistence/personalTripStorage';
import type { PersonalTrip } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { useMoscowTheme } from '../../theme/MoscowTheme';
import TouristTodayCard from './TouristTodayCard';

type Props = {
  language: AppLanguage;
  onOpenTrip: () => void;
};

export default function TripTodaySurface({ language, onOpenTrip }: Props) {
  const { palette } = useMoscowTheme();
  const [trip,setTrip]=useState<PersonalTrip|null>(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    loadPersonalTrip()
      .then(setTrip)
      .catch(()=>setTrip(null))
      .finally(()=>setLoaded(true));
  },[]);

  if(!loaded) return null;

  if(!trip){
    return (
      <View style={[styles.empty,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <Text style={styles.kicker}>{tr(language,'СЕГОДНЯ','TODAY','今天')}</Text>
        <Text style={[styles.title,{color:palette.text}]}>{tr(language,'Сначала создайте поездку','Create your trip first','先创建你的行程')}</Text>
        <Text style={[styles.body,{color:palette.textMuted}]}>
          {tr(
            language,
            'Today собирает ваш реальный день: билеты, брони, свободные окна, события и изменения.',
            'Today runs your real day: tickets, bookings, free windows, events and changes.',
            'Today 会整合你的真实一天：门票、预订、空闲时段、活动和变化。'
          )}
        </Text>
        <PhysicalPressable style={[styles.primary,{backgroundColor:palette.accent}]} contentStyle={styles.center} strong onPress={onOpenTrip}>
          <Text style={[styles.primaryText,{color:palette.accentText}]}>{tr(language,'Создать план','Build a plan','创建计划')} →</Text>
        </PhysicalPressable>
      </View>
    );
  }

  return (
    <View>
      <TouristTodayCard
        trip={trip}
        language={language}
        visitedIds={[]}
        onOpenPlace={()=>undefined}
        showLegacyUnseen={false}
      />
      <PhysicalPressable style={[styles.secondary,{borderColor:palette.borderStrong}]} contentStyle={styles.center} onPress={onOpenTrip}>
        <Text style={[styles.secondaryText,{color:palette.accentStrong}]}>{tr(language,'Открыть полный план','Open full plan','打开完整计划')} →</Text>
      </PhysicalPressable>
    </View>
  );
}

const styles=StyleSheet.create({
  empty:{borderRadius:22,padding:18,backgroundColor:'#12161a',borderWidth:1,borderColor:'#30363d'},
  kicker:{color:'#b99b69',fontSize:8,fontWeight:'900',letterSpacing:1.2},
  title:{color:'#f4efe6',fontSize:21,fontWeight:'900',marginTop:6},
  body:{color:'#9299a0',fontSize:11,lineHeight:17,marginTop:7},
  primary:{minHeight:48,borderRadius:15,backgroundColor:'#d7bb84',marginTop:14},
  primaryText:{color:'#17130d',fontSize:10,fontWeight:'900'},
  secondary:{minHeight:44,borderRadius:14,borderWidth:1,borderColor:'#414850',marginTop:10},
  secondaryText:{color:'#d7bb84',fontSize:9,fontWeight:'900'},
  center:{alignItems:'center',justifyContent:'center',paddingHorizontal:12}
});
