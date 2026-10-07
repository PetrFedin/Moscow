import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { loadPersonalTrip } from '../../persistence/personalTripStorage';
import type { PersonalTrip } from '../../travel/personalTrip';
import MoscowPassportCard from './MoscowPassportCard';

export default function TripMoscowHistorySurface({ language }:{ language:AppLanguage }) {
  const [trip,setTrip]=useState<PersonalTrip|null>(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    loadPersonalTrip()
      .then(setTrip)
      .catch(()=>setTrip(null))
      .finally(()=>setLoaded(true));
  },[]);

  if(!loaded || !trip || trip.visits.length===0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>
        {tr(language,'ПОСЕЩЕНИЯ ИЗ TRIP OS','TRIP OS VISITS','TRIP OS 到访记录')}
      </Text>
      <MoscowPassportCard trip={trip} language={language} />
    </View>
  );
}

const styles=StyleSheet.create({
  wrap:{marginBottom:18},
  sectionLabel:{color:'#7f8b83',fontSize:8,fontWeight:'900',letterSpacing:1.2,marginBottom:6}
});
