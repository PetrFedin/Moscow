export type CuratedMoscowCategory = 'museum' | 'theatre' | 'park' | 'restaurant';
export type CuratedMoscowPlace = {
  id: string;
  titleRu: string;
  titleEn: string;
  kind: CuratedMoscowCategory;
  addressRu: string;
  officialUrl: string;
  /** Explicit source for the location identity/address; not a live availability check. */
  addressEvidenceUrl: string;
  addressCheckedAt: '2026-10-13';
  districtRu: string;
  descriptionRu: string;
  /** Curated source identity only; not a claim about ticket stock, venue hours or booking availability. */
  evidenceStatus: 'official-source-directory';
};

/** Phase 1: official-source directory. No live opening hours, prices or reservation claims. */
export const curatedMoscowPlaces: CuratedMoscowPlace[] = [
  { id:'tretyakov-lavrushinsky',titleRu:'Третьяковская галерея',titleEn:'Tretyakov Gallery',kind:'museum',addressRu:'Лаврушинский пер., 10',officialUrl:'https://www.tretyakovgallery.ru/for-visitors/museums/istoricheskoe-zdanie/',addressEvidenceUrl:'https://www.tretyakovgallery.ru/for-visitors/museums/istoricheskoe-zdanie/',addressCheckedAt:'2026-10-13',districtRu:'Замоскворечье',descriptionRu:'Русское искусство и постоянная коллекция в историческом здании.',evidenceStatus:'official-source-directory' },
  { id:'pushkin-volkhonka',titleRu:'ГМИИ имени А. С. Пушкина',titleEn:'Pushkin Museum of Fine Arts',kind:'museum',addressRu:'ул. Волхонка, 12',officialUrl:'https://www.pushkinmuseum.art/museum/buildings/main/index.php?lang=ru',addressEvidenceUrl:'https://www.pushkinmuseum.art/museum/buildings/main/index.php?lang=ru',addressCheckedAt:'2026-10-13',districtRu:'Хамовники',descriptionRu:'Собрание мирового искусства, живопись и временные выставки.',evidenceStatus:'official-source-directory' },
  { id:'bolshoi-theatre',titleRu:'Большой театр',titleEn:'Bolshoi Theatre',kind:'theatre',addressRu:'Театральная пл., 1',officialUrl:'https://bolshoi.ru/',addressEvidenceUrl:'https://www.culture.ru/institutes/10218/gosudarstvennyi-akademicheskii-bolshoi-teatr-rossii-istoricheskaya-scena',addressCheckedAt:'2026-10-13',districtRu:'Тверской',descriptionRu:'Опера и балет. Спектакль, сцену и билеты необходимо проверять на конкретную дату.',evidenceStatus:'official-source-directory' },
  { id:'zaryadye-park',titleRu:'Парк «Зарядье»',titleEn:'Zaryadye Park',kind:'park',addressRu:'ул. Варварка, 6, стр. 1',officialUrl:'https://welcome.zaryadyepark.ru/',addressEvidenceUrl:'https://welcome.zaryadyepark.ru/',addressCheckedAt:'2026-10-13',districtRu:'Китай-город',descriptionRu:'Пейзажный парк рядом с Кремлём; отдельные объекты могут иметь собственный билетный режим.',evidenceStatus:'official-source-directory' },
  { id:'gorky-park',titleRu:'Парк Горького',titleEn:'Gorky Park',kind:'park',addressRu:'ул. Крымский Вал, 9',officialUrl:'https://parkgorkogo.ru/contacts/',addressEvidenceUrl:'https://parkgorkogo.ru/contacts/',addressCheckedAt:'2026-10-13',districtRu:'Якиманка',descriptionRu:'Прогулки и разнообразные городские активности. Доступность отдельных услуг не проверена.',evidenceStatus:'official-source-directory' },
  { id:'cafe-pushkin-tverskoy',titleRu:'Кафе Пушкинъ',titleEn:'Café Pushkin',kind:'restaurant',addressRu:'Тверской бульвар, 26А',officialUrl:'https://cafe-pushkin.ru/',addressEvidenceUrl:'https://cafe-pushkin.ru/wp-content/uploads/2024/06/delovye-obedy.pdf',addressCheckedAt:'2026-10-13',districtRu:'Тверской',descriptionRu:'Ресторан русской дворянской кухни в историческом интерьере. Бронирование и доступность столов проверяются на сайте.',evidenceStatus:'official-source-directory' },
  { id:'voronezh-prechistenka',titleRu:'Ресторан «Воронеж»',titleEn:'Voronezh Restaurant',kind:'restaurant',addressRu:'ул. Пречистенка, 4',officialUrl:'https://voronej.com/',addressEvidenceUrl:'https://voronej.com/',addressCheckedAt:'2026-10-13',districtRu:'Хамовники',descriptionRu:'Ресторан мясной кухни на Пречистенке. Наличие столов и меню необходимо проверять напрямую.',evidenceStatus:'official-source-directory' }
];
export function curatedMoscowPlace(id:string){return curatedMoscowPlaces.find(p=>p.id===id);}
