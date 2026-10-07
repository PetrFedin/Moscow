export type CityPulseDemoOpportunity = {
  id: string;
  district: string;
  category: 'culture' | 'food' | 'event' | 'park' | 'nightlife' | 'shopping';
  titleRu: string;
  titleEn: string;
  titleZh: string;
  fit: string;
  reasonRu: string;
  reasonEn: string;
  reasonZh: string;
  loadState: 'balanced' | 'popular' | 'underused';
  availabilityState: 'demo';
  partnerValueRu: string;
  cityValueRu: string;
};

export const cityPulseDemoOpportunities: CityPulseDemoOpportunity[] = [
  {
    id:'basmanny-culture-window',
    district:'Басманный',
    category:'culture',
    titleRu:'Архитектура + камерная культура',
    titleEn:'Architecture + intimate culture',
    titleZh:'建筑 + 小型文化体验',
    fit:'90 min',
    reasonRu:'Подходит в свободное окно между двумя фиксированными планами и расширяет поездку за пределы перегруженного центра.',
    reasonEn:'Fits a 90-minute free window between fixed commitments and expands the trip beyond the busiest central cluster.',
    reasonZh:'适合两个固定安排之间的90分钟空档，并把行程扩展到最拥挤中心区之外。',
    loadState:'underused',
    availabilityState:'demo',
    partnerValueRu:'Квалифицированный спрос в конкретное временное окно.',
    cityValueRu:'Распределение потока в качественный недоиспользованный кластер.'
  },
  {
    id:'zamoskvorechye-evening',
    district:'Замоскворечье',
    category:'food',
    titleRu:'Ужин + вечерняя прогулка',
    titleEn:'Dinner + evening walk',
    titleZh:'晚餐 + 夜间散步',
    fit:'2–3 h',
    reasonRu:'Логичное продолжение после культурного блока: меньше возвратов через центр и больше ценности в одном районе.',
    reasonEn:'A natural continuation after a cultural block: less backtracking through the centre and more value within one district.',
    reasonZh:'适合作为文化行程后的延续：减少返回市中心的折返，并在同一区域创造更多价值。',
    loadState:'balanced',
    availabilityState:'demo',
    partnerValueRu:'Связка посещения с последующим ресторанным спросом.',
    cityValueRu:'Рост вечерней экономики и более длинное пребывание в районе.'
  },
  {
    id:'presnya-event-bridge',
    district:'Пресненский',
    category:'event',
    titleRu:'Временное событие как повод открыть район',
    titleEn:'Temporary event as a district discovery trigger',
    titleZh:'用临时活动带动城区探索',
    fit:'evening',
    reasonRu:'Событие используется как якорь, после которого приложение предлагает еду, прогулку и другие места поблизости.',
    reasonEn:'The event acts as an anchor; the app then proposes food, walks and nearby places.',
    reasonZh:'活动作为锚点，随后应用推荐附近餐饮、散步路线和其他地点。',
    loadState:'balanced',
    availabilityState:'demo',
    partnerValueRu:'Событие приводит не только билет, но и дополнительный локальный спрос.',
    cityValueRu:'Измеримый spillover события на районную экономику.'
  },
  {
    id:'vdnh-family-day',
    district:'Останкинский / ВДНХ',
    category:'park',
    titleRu:'Семейный день вне центра',
    titleEn:'Family day beyond the centre',
    titleZh:'市中心之外的家庭一日游',
    fit:'half-day',
    reasonRu:'Для семьи с длинным свободным блоком выгоднее один насыщенный кластер, чем несколько дальних переездов.',
    reasonEn:'For a family with a long free block, one rich cluster is better than several long transfers.',
    reasonZh:'对于有较长空闲时间的家庭，一个内容丰富的区域比多次长距离移动更合适。',
    loadState:'underused',
    availabilityState:'demo',
    partnerValueRu:'Длинный dwell time и несколько последовательных категорий спроса.',
    cityValueRu:'Распределение туристической активности по более широкому городу.'
  }
];

export type CityPulseDemoLoad = {
  district:string;
  state:'high'|'balanced'|'opportunity';
  noteRu:string;
  noteEn:string;
  noteZh:string;
};

export const cityPulseDemoLoads:CityPulseDemoLoad[]=[
  {district:'Красная площадь / центр',state:'high',noteRu:'DEMO · высокий интерес в текущем временном окне',noteEn:'DEMO · high interest in this time window',noteZh:'DEMO · 当前时段关注度较高'},
  {district:'Замоскворечье',state:'balanced',noteRu:'DEMO · сбалансированный спрос',noteEn:'DEMO · balanced demand',noteZh:'DEMO · 需求较均衡'},
  {district:'Басманный',state:'opportunity',noteRu:'DEMO · качественное предложение с запасом',noteEn:'DEMO · quality supply with room',noteZh:'DEMO · 优质供给仍有空间'},
  {district:'ВДНХ',state:'opportunity',noteRu:'DEMO · возможность для длинного дневного сценария',noteEn:'DEMO · opportunity for a longer day scenario',noteZh:'DEMO · 适合更长的一日场景'}
];
