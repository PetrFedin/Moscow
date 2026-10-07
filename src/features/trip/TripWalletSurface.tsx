import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { loadPersonalTrip } from '../../persistence/personalTripStorage';
import type { PersonalTrip } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { useMoscowTheme } from '../../theme/MoscowTheme';
import BookingWalletCard from './BookingWalletCard';

type Props = {
  language: AppLanguage;
  onOpenTrip: () => void;
};

export default function TripWalletSurface({ language, onOpenTrip }: Props) {
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
        <Text style={styles.kicker}>WALLET</Text>
        <Text style={[styles.title,{color:palette.text}]}>{tr(language,'Билеты и брони появятся здесь','Tickets and bookings live here','门票和预订会显示在这里')}</Text>
        <Text style={[styles.body,{color:palette.textMuted}]}>
          {tr(
            language,
            'Добавьте свою поездку и существующие подтверждения. Moscow всегда показывает, что введено вами, а что подтверждено провайдером.',
            'Add a trip and your existing confirmations. Moscow always distinguishes what you entered from provider-confirmed truth.',
            '添加行程和已有确认信息。Moscow 始终区分你自行录入的信息和供应商确认信息。'
          )}
        </Text>
        <PhysicalPressable style={[styles.primary,{backgroundColor:palette.accent}]} contentStyle={styles.center} strong onPress={onOpenTrip}>
          <Text style={[styles.primaryText,{color:palette.accentText}]}>{tr(language,'Открыть поездку','Open trip','打开行程')} →</Text>
        </PhysicalPressable>
      </View>
    );
  }

  const hasCommitments=trip.items.some(item=>item.commitment && item.commitment.status!=='cancelled');

  return (
    <View>
      {hasCommitments ? (
        <BookingWalletCard trip={trip} language={language} />
      ) : (
        <View style={[styles.empty,{backgroundColor:palette.surface,borderColor:palette.border}]}>
          <Text style={styles.kicker}>WALLET</Text>
          <Text style={[styles.title,{color:palette.text}]}>{tr(language,'Пока нет билетов и броней','No tickets or bookings yet','暂无门票或预订')}</Text>
          <Text style={[styles.body,{color:palette.textMuted}]}>
            {tr(
              language,
              'Добавьте в поездку свой билет, ресторанную бронь или событие. User-declared подтверждения не выдаются за provider-confirmed.',
              'Add your ticket, restaurant reservation or event to the trip. User-declared confirmations are never presented as provider-confirmed.',
              '把门票、餐厅预订或活动加入行程。用户自行声明的确认信息不会被显示为供应商确认。'
            )}
          </Text>
        </View>
      )}
      <PhysicalPressable style={[styles.secondary,{borderColor:palette.borderStrong}]} contentStyle={styles.center} onPress={onOpenTrip}>
        <Text style={[styles.secondaryText,{color:palette.accentStrong}]}>{tr(language,'Управлять планом','Manage plan','管理计划')} →</Text>
      </PhysicalPressable>
    </View>
  );
}

const styles=StyleSheet.create({
  empty:{borderRadius:22,padding:18,backgroundColor:'#14131a',borderWidth:1,borderColor:'#393544'},
  kicker:{color:'#aa9bc6',fontSize:8,fontWeight:'900',letterSpacing:1.2},
  title:{color:'#f0ebf7',fontSize:20,fontWeight:'900',marginTop:6},
  body:{color:'#86818e',fontSize:10.5,lineHeight:16,marginTop:7},
  primary:{minHeight:48,borderRadius:15,backgroundColor:'#d7bb84',marginTop:14},
  primaryText:{color:'#17130d',fontSize:10,fontWeight:'900'},
  secondary:{minHeight:44,borderRadius:14,borderWidth:1,borderColor:'#4a4254',marginTop:10},
  secondaryText:{color:'#cbb3df',fontSize:9,fontWeight:'900'},
  center:{alignItems:'center',justifyContent:'center',paddingHorizontal:12}
});
