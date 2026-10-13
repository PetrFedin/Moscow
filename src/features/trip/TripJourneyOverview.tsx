import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip, PersonalTripItem } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';

function time(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' }).format(d);
}
function symbol(item: PersonalTripItem) {
  if (item.commitment?.kind === 'ticket') return '♫';
  if (item.commitment?.kind === 'reservation') return '◈';
  if (['food', 'restaurant', 'cafe', 'bar'].includes(item.kind)) return '☕';
  if (['museum', 'gallery', 'exhibition'].includes(item.kind)) return '◇';
  return '⌖';
}
export default function TripJourneyOverview({ trip, dayDate, language, onVisit, onOpenDetails }: {
  trip: PersonalTrip; dayDate: string; language: AppLanguage; onVisit: (id: string) => void; onOpenDetails: () => void;
}) {
  const items = trip.items.filter(item => item.dayDate === dayDate).sort((a,b) =>
    (a.plannedStartAt ?? '').localeCompare(b.plannedStartAt ?? '') || (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const visited = new Set(trip.visits.filter(v => v.dayDate === dayDate).map(v => v.itemId));
  const next = items.find(item => item.status === 'planned' && !visited.has(item.id));
  const bookings = items.filter(item => item.commitment);
  return <View style={styles.root}>
    <View style={styles.hero}>
      <Text style={styles.kicker}>{tr(language, 'ВАШ ДЕНЬ В МОСКВЕ', 'YOUR DAY IN MOSCOW', '你的莫斯科之旅')}</Text>
      <Text style={styles.headline}>{next ? tr(language, 'Впереди ещё много интересного', 'More of Moscow awaits', '更多精彩在等你') : tr(language, 'Ваш день в Москве', 'Your day in Moscow', '莫斯科的一天')}</Text>
      <Text style={styles.summary}>{items.length} {tr(language, 'мест в плане', 'planned stops', '个行程')} · {visited.size} {tr(language, 'посещено', 'visited', '已到访')}</Text>
      {next && <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>{tr(language, 'СЛЕДУЮЩАЯ ОСТАНОВКА', 'NEXT STOP', '下一站')} · {time(next.plannedStartAt)}</Text>
        <Text style={styles.nextTitle}>{next.title}</Text>
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Я был здесь','I visited this place','我到过这里')} style={styles.action} contentStyle={styles.actionInner} onPress={() => onVisit(next.id)}>
          <Text style={styles.actionText}>{tr(language, 'Отметить посещение', 'Mark as visited', '标记为已到访')}</Text>
          <Text style={styles.actionText}>↗</Text>
        </PhysicalPressable>
      </View>}
    </View>
    <View style={styles.heading}>
      <Text style={styles.sectionTitle}>{tr(language, 'Маршрут дня', 'Your itinerary', '当天路线')}</Text>
      <Text style={styles.sectionHint}>{tr(language, 'В хронологическом порядке', 'In time order', '按时间顺序')}</Text>
    </View>
    {items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>{tr(language, 'Начните с одного интересного места или добавьте билет.', 'Start with a place or add your ticket.', '添加地点或门票开始旅程。')}</Text></View> : items.map((item,index)=>
      <View key={item.id} style={styles.stop}>
        <View style={styles.track}><View style={[styles.dot, visited.has(item.id) && styles.doneDot]}><Text style={styles.dotText}>{symbol(item)}</Text></View>{index < items.length - 1 && <View style={styles.line}/>}</View>
        <View style={styles.stopCard}>
          <View style={styles.stopHeader}><Text style={styles.stopTime}>{time(item.plannedStartAt)}</Text>{item.commitment && <Text style={styles.bookingFlag}>{item.commitment.kind === 'ticket' ? tr(language,'Билет','Ticket','门票') : tr(language,'Бронь','Reservation','预订')}</Text>}</View>
          <Text style={styles.stopTitle}>{item.title}</Text>
          <Text style={styles.stopSub}>{visited.has(item.id) ? tr(language,'Вы отметили посещение','Marked as visited','已到访') : item.commitment?.verification === 'provider-confirmed' ? tr(language,'Бронирование проверено','Booking verified','预订已确认') : item.commitment ? tr(language,'Добавлено вами','Added by you','手动添加') : tr(language,'В вашем плане','On your itinerary','已加入行程')}</Text>
        </View>
      </View>)}
    {bookings.length > 0 && <View style={styles.ticketPanel}>
      <Text style={styles.ticketTitle}>{tr(language,'Ваши билеты и брони','Tickets & reservations','门票与预订')}</Text>
      <Text style={styles.ticketText}>{bookings.length} {tr(language,'сохранено в этом дне. Детали доступны ниже.','saved for this day. Full details below.','条已保存，详细信息见下方。')}</Text>
    </View>}
    <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Настроить подробности поездки','Manage trip details','管理行程详情')} style={styles.detailsButton} contentStyle={styles.detailsContent} onPress={onOpenDetails}>
      <Text style={styles.detailsText}>{tr(language,'Управлять маршрутом и билетами','Manage route and tickets','管理路线与门票')}</Text><Text style={styles.detailsText}>↗</Text>
    </PhysicalPressable>
  </View>;
}
const styles=StyleSheet.create({
 root:{marginTop:18,marginBottom:20},hero:{backgroundColor:'#253c35',padding:22,borderRadius:26},
 kicker:{color:'#d9c6a2',fontSize:10,letterSpacing:1.2,fontWeight:'700'},headline:{fontSize:27,lineHeight:33,color:'#fff7e8',fontWeight:'700',marginTop:11},
 summary:{fontSize:13,color:'#c6d6cb',marginTop:9},nextCard:{marginTop:23,backgroundColor:'#f4eddf',borderRadius:19,padding:17},
 nextLabel:{color:'#67726b',fontSize:10,fontWeight:'700',letterSpacing:0.8},nextTitle:{color:'#263832',fontSize:21,lineHeight:26,fontWeight:'700',marginTop:9,marginBottom:15},
 action:{backgroundColor:'#283e35',borderRadius:13,minHeight:48},actionInner:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:15},
 actionText:{color:'#f5f0e5',fontSize:14,fontWeight:'700'},heading:{marginTop:27,marginBottom:17,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:8},
 sectionTitle:{color:'#f4efe7',fontSize:23,fontWeight:'700',flexShrink:1},sectionHint:{fontSize:10,color:'#9ba59d',marginBottom:3},stop:{flexDirection:'row',gap:11},
 track:{width:38,alignItems:'center'},dot:{width:38,height:38,borderRadius:19,backgroundColor:'#33483f',alignItems:'center',justifyContent:'center'},doneDot:{backgroundColor:'#6a674a'},
 dotText:{color:'#f2ddba',fontSize:20},line:{width:2,minHeight:48,flex:1,backgroundColor:'#36463f',marginVertical:4},
 stopCard:{flex:1,backgroundColor:'#1b2623',borderWidth:1,borderColor:'#33423c',borderRadius:16,padding:15,marginBottom:12},
 stopHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},stopTime:{color:'#e5c591',fontSize:12,fontWeight:'700'},
 bookingFlag:{color:'#f0dcb8',fontSize:11,backgroundColor:'#3a483c',overflow:'hidden',paddingHorizontal:9,paddingVertical:4,borderRadius:9},
 stopTitle:{fontSize:17,lineHeight:23,color:'#f3eee6',fontWeight:'700',marginTop:9},stopSub:{color:'#a5b0a7',fontSize:12,marginTop:7},
 ticketPanel:{borderRadius:18,padding:17,backgroundColor:'#252d29',marginTop:12},ticketTitle:{color:'#f4eddf',fontSize:17,fontWeight:'700'},
 ticketText:{color:'#afb9b0',fontSize:12,lineHeight:18,marginTop:7},detailsButton:{minHeight:50,borderRadius:15,borderColor:'#4b5d50',borderWidth:1,marginTop:14},
 detailsContent:{flexDirection:'row',paddingHorizontal:15,alignItems:'center',justifyContent:'space-between'},
 detailsText:{color:'#f1debe',fontSize:13,fontWeight:'700'},empty:{backgroundColor:'#1d2824',padding:22,borderRadius:18},emptyText:{color:'#c8d2ca',fontSize:14,lineHeight:22}
});