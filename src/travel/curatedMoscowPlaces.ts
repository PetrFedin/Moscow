export type CuratedMoscowCategory = 'museum' | 'theatre' | 'park' | 'restaurant';
export type CuratedMoscowPlace = {
  id: string;
  titleRu: string;
  titleEn: string;
  kind: CuratedMoscowCategory;
  addressRu: string;
  officialUrl: string;
  districtRu: string;
  descriptionRu: string;
  /** Curated source identity only; not a claim about ticket stock, venue hours or booking availability. */
  evidenceStatus: 'official-source-directory';
};

/** Phase 1: official-source directory. No live opening hours, prices or reservation claims. */
export const curatedMoscowPlaces: CuratedMoscowPlace[] = [
  { id:'tretyakov-lavrushinsky',titleRu:'Третьяковская галерея',titleEn:'Tretyakov Gallery',kind:'museum',addressRu:'Лаврушинский пер., 10',officialUrl:'https://www.tretyakovgallery.ru/',districtRu:'Замоскворечье',descriptionRu:'Русское искусство и постоянная коллекция в историческом здании.',evidenceStatus:'official-source-directory' },
  { id:'pushkin-volkhonka',titleRu:'ГМИИ имени А. С. Пушкина',titleEn:'Pushkin Museum of Fine Arts',kind:'museum',addressRu:'ул. Волхонка, 12',officialUrl:'https://pushkinmuseum.art/',districtRu:'Хамовники',descriptionRu:'Собрание мирового искусства, живопись и временные выставки.',evidenceStatus:'official-source-directory' },
  { id:'bolshoi-theatre',titleRu:'Большой театр',titleEn:'Bolshoi Theatre',kind:'theatre',addressRu:'Театральная пл., 1',officialUrl:'https://bolshoi.ru/',districtRu:'Тверской',descriptionRu:'Опера и балет. Спектакль, сцену и билеты необходимо проверять на конкретную дату.',evidenceStatus:'official-source-directory' },
  { id:'zaryadye-park',titleRu:'Парк «Зарядье»',titleEn:'Zaryadye Park',kind:'park',addressRu:'ул. Варварка, 6, стр. 1',officialUrl:'https://www.zaryadyepark.ru/',districtRu:'Китай-город',descriptionRu:'Пейзажный парк рядом с Кремлём; отдельные объекты могут иметь собственный билетный режим.',evidenceStatus:'official-source-directory' },
  { id:'gorky-park',titleRu:'Парк Горького',titleEn:'Gorky Park',kind:'park',addressRu:'ул. Крымский Вал, 9',officialUrl:'https://parkgorkogo.ru/',districtRu:'Якиманка',descriptionRu:'Прогулки и разнообразные городские активности. Доступность отдельных услуг не проверена.',evidenceStatus:'official-source-directory' }
];
export function curatedMoscowPlace(id:string){return curatedMoscowPlaces.find(p=>p.id===id);}
