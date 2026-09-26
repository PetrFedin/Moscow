export type VarvarkaAudioLocale = 'ru' | 'en' | 'zh';
export type VarvarkaAudioStatus = 'script-approved' | 'recording-pending' | 'production-ready';

export type ProductionAudioMaster = {
  masterUrl: string;
  filename: string;
  sha256: string;
  durationSeconds: number;
  narratorCredit: string;
  rightsEvidenceRef: string;
};

export type VarvarkaAudioTrack = {
  id: string;
  version: number;
  placeId: string;
  locale: VarvarkaAudioLocale;
  status: VarvarkaAudioStatus;
  scriptApprovedAt: string;
  targetDurationSeconds: number;
  transcript: string;
  sourceUrls: string[];
  production?: ProductionAudioMaster;
};

export type WalkAudioPlan = {
  trackId: string;
  placeId: string;
  locale: VarvarkaAudioLocale;
  mode: 'recorded' | 'tts-fallback';
  transcript: string;
  masterUrl?: string;
  productionStatus: VarvarkaAudioStatus;
  displayTitle: string;
};

const SHA256 = /^[a-f0-9]{64}$/i;

export function isProductionAudioTrack(track?: VarvarkaAudioTrack | null) {
  const master = track?.production;
  return Boolean(
    track
    && track.status === 'production-ready'
    && master
    && master.masterUrl.startsWith('https://')
    && /^[A-Za-z0-9._-]+$/.test(master.filename)
    && !master.filename.includes('..')
    && SHA256.test(master.sha256)
    && Number.isFinite(master.durationSeconds)
    && master.durationSeconds > 0
    && master.narratorCredit.trim()
    && master.rightsEvidenceRef.trim()
    && track.transcript.trim()
    && track.sourceUrls.length > 0
  );
}

const source = {
  barbara: [
    'https://www.mos.ru/upload/documents/files/6187/AKT-GIKE-Krasnaya-pl-d5-ispravlennii.pdf',
    'https://www.mos.ru/upload/documents/files/3331/MN_3_2017_finalfinal.pdf'
  ],
  english: [
    'https://welcome.zaryadyepark.ru/map',
    'https://mosmuseum.ru/news/p/staryiy-angliyskiy-dvor-stanet-chastyu-parka-zaryade/',
    'https://mosmuseum.ru/news/p/muzey-moskvyi-otkryil-staryiy-angliyskiy-dvor-posle-restavratsii/'
  ],
  romanov: [
    'https://shm.ru/museum/pbr/',
    'https://commons.wikimedia.org/wiki/File:Палаты_бояр_Романовых._1857.jpg',
    'https://commons.wikimedia.org/wiki/File:N.A.Naidenov_(1884)._Views_of_Moscow._46._Varvarka.png'
  ],
  znamensky: [
    'https://www.mos.ru/upload/documents/oiv/zaryade_26062017_.pdf',
    'https://www.mos.ru/upload/documents/files/1/Moskovskoenasledie32.pdf'
  ],
  gates: [
    'https://www.mos.ru/upload/documents/files/743/GIKEStenaKitai-goroda_MoskvaKitaigorodskiiprd2(chast)d2(chast).pdf',
    'https://www.mos.ru/upload/documents/files/3108/AktKitaigorodskayastenaNovayaNovaya.pdf'
  ]
} as const;

function pending(input: Omit<VarvarkaAudioTrack, 'status' | 'version' | 'scriptApprovedAt'>): VarvarkaAudioTrack {
  return {
    ...input,
    version: 1,
    status: 'recording-pending',
    scriptApprovedAt: '2026-09-23'
  };
}

export const varvarkaAudioCatalog: VarvarkaAudioTrack[] = [
  pending({
    id: 'varvarka-barbara-ru-v1',
    placeId: 'church-st-barbara',
    locale: 'ru',
    targetDurationSeconds: 52,
    sourceUrls: [...source.barbara],
    transcript: 'Перед вами храм Варвары Великомученицы — точка, с которой удобно начинать Варварку. Каменный храм на этом месте появился в 1514 году и связан с богатыми сурожскими купцами. Существующее здание возвели значительно позже, на рубеже XVIII и XIX веков, по проекту Родиона Казакова. Посмотрите на храм не как на один застывший памятник, а как на одно место, где город несколько раз менял архитектурный язык. И обратите внимание на саму улицу: память о святой Варваре сохранилась не только в здании, но и в названии Варварки.'
  }),
  pending({
    id: 'varvarka-barbara-en-v1',
    placeId: 'church-st-barbara',
    locale: 'en',
    targetDurationSeconds: 52,
    sourceUrls: [...source.barbara],
    transcript: 'You are standing by the Church of St Barbara, a natural western starting point for Varvarka. A stone church stood here from 1514 and was associated with wealthy Surozh merchants. The building you see today is much later, created around the turn of the nineteenth century to a design by Rodion Kazakov. Think of this not as one frozen monument, but as a single site where Moscow repeatedly changed its architectural language. The memory of St Barbara survives not only in the church itself, but also in the name of Varvarka Street.'
  }),
  pending({
    id: 'varvarka-barbara-zh-v1',
    placeId: 'church-st-barbara',
    locale: 'zh',
    targetDurationSeconds: 58,
    sourceUrls: [...source.barbara],
    transcript: '你现在站在圣瓦尔瓦拉教堂旁，这里很适合作为瓦尔瓦尔卡街历史路线的西侧起点。1514年，这里已经出现石砌教堂，并与富裕的苏罗日商人群体有关。今天看到的建筑要晚得多，建于18世纪末到19世纪初，设计者是罗季翁·卡扎科夫。不要把它只看成一座静止的古迹，而要把这里理解为莫斯科城市语言不断变化的同一个地点：更早的宗教建筑、古典主义时期的新教堂以及今天的街道空间叠加在一起。再看看街名本身，圣瓦尔瓦拉的记忆不仅留在建筑中，也留在“瓦尔瓦尔卡”这个名字里。'
  }),
  pending({
    id: 'varvarka-english-court-ru-v1',
    placeId: 'old-english-court',
    locale: 'ru',
    targetDurationSeconds: 55,
    sourceUrls: [...source.english],
    transcript: 'Старый Английский двор напоминает, что Варварка была не только улицей храмов и боярских палат, но и частью международной торговой Москвы. В XVI веке здесь разместилось английское торговое подворье, связанное с ранними русско-английскими контактами. Позднейшие перестройки почти скрыли древние палаты, и в XX веке их заново распознал и отстаивал реставратор Пётр Барановский. Поэтому ранний облик, который мы воспринимаем сегодня, важно отличать от прямого документального снимка XVI века: это результат научного исследования и реставрации. Посмотрите на здание и попробуйте увидеть в нём одновременно торговый двор, утраченные наслоения и современный музей.'
  }),
  pending({
    id: 'varvarka-english-court-en-v1',
    placeId: 'old-english-court',
    locale: 'en',
    targetDurationSeconds: 55,
    sourceUrls: [...source.english],
    transcript: 'The Old English Court shows that Varvarka was not only a street of churches and boyar chambers, but also part of international trading Moscow. In the sixteenth century an English trading court operated here, tied to early Anglo-Russian contacts. Later alterations almost concealed the ancient chambers, until restorer Pyotr Baranovsky identified and defended them in the twentieth century. That is why the early appearance we see today should not be confused with a direct sixteenth-century snapshot: it is the result of research and scholarly restoration. Look at the building as several histories at once — trading court, later layers, rediscovered monument and modern museum.'
  }),
  pending({
    id: 'varvarka-english-court-zh-v1',
    placeId: 'old-english-court',
    locale: 'zh',
    targetDurationSeconds: 62,
    sourceUrls: [...source.english],
    transcript: '老英国商馆提醒我们，瓦尔瓦尔卡街不仅有教堂和贵族宅邸，它还是国际贸易莫斯科的一部分。16世纪，英国商贸机构在这里设立商馆，与早期俄英贸易和外交往来密切相关。后来数百年的改建几乎把古老宅邸隐藏起来，直到20世纪，修复专家彼得·巴拉诺夫斯基重新识别并推动保护这座建筑。因此，今天看到的早期面貌不能被当成16世纪的直接照片，它来自历史研究与学术修复。观察建筑时，可以同时想象四个层次：早期贸易商馆、后来的改造、重新发现的古迹，以及今天作为博物馆的空间。'
  }),
  pending({
    id: 'varvarka-romanov-ru-v1',
    placeId: 'romanov-chambers',
    locale: 'ru',
    targetDurationSeconds: 58,
    sourceUrls: [...source.romanov],
    transcript: 'Палаты бояр Романовых — главная пространственная кульминация пилота. Здесь особенно важно разделять то, что сохранилось, то, что документировано архивными изображениями, и то, что было восстановлено в XIX веке. Вид 1857 года показывает палаты до масштабной реставрации. После работ под руководством Фёдора Рихтера здание получило образ, который во многом формирует наше сегодняшнее восприятие памятника. В приложении эти состояния не смешиваются в один красивый фильтр: они показаны как разные доказательные слои. Посмотрите сначала на каменное ядро и устойчивые части фасада — именно они служат опорой, когда историческая модель совмещается с реальным зданием.'
  }),
  pending({
    id: 'varvarka-romanov-en-v1',
    placeId: 'romanov-chambers',
    locale: 'en',
    targetDurationSeconds: 58,
    sourceUrls: [...source.romanov],
    transcript: 'The Chambers of the Romanov Boyars are the main spatial climax of this pilot. Here it is essential to separate what physically survives, what is documented in archival images, and what was restored in the nineteenth century. An 1857 view records the chambers before the major restoration. Work led by Fyodor Richter then created much of the appearance through which the monument is recognised today. The app does not blend those states into one attractive filter: it treats them as separate evidence layers. Begin by looking at the stone core and the most stable parts of the facade — these are the real-world references used when a historical model is aligned with the building.'
  }),
  pending({
    id: 'varvarka-romanov-zh-v1',
    placeId: 'romanov-chambers',
    locale: 'zh',
    targetDurationSeconds: 66,
    sourceUrls: [...source.romanov],
    transcript: '罗曼诺夫贵族宅邸是这次试点中最重要的空间体验点。在这里尤其要区分三件事：今天仍然真实保存的部分、档案图像能够直接证明的部分，以及19世纪修复过程中重新形成的部分。1857年的历史图像记录了大规模修复之前的宅邸状态，随后在费奥多尔·里希特主持的工程中，建筑获得了很大程度上塑造今天公众认知的外观。应用不会把这些时代混合成一个漂亮滤镜，而是把它们作为不同证据等级的空间层。先观察石砌核心和较稳定的立面部分，它们正是历史模型与现实建筑进行现场对齐时最重要的参照。'
  }),
  pending({
    id: 'varvarka-znamensky-ru-v1',
    placeId: 'znamensky-cathedral',
    locale: 'ru',
    targetDurationSeconds: 50,
    sourceUrls: [...source.znamensky],
    transcript: 'Знаменский собор помогает увидеть Варварку как большой исторический ансамбль, а не набор отдельных достопримечательностей. Существующий собор построили в 1679–1684 годах; он стал композиционным центром Знаменского монастыря, связанного с территорией старой усадьбы Романовых. В XX веке здание пережило переделки и новые функции, а в 1963–1972 годах прошло крупную научную реставрацию. Остановитесь и посмотрите, как собор работает в масштабе улицы: его объём связывает палаты, монастырскую территорию и современное Зарядье. Здесь история читается не только в деталях фасада, но и в самом городском силуэте.'
  }),
  pending({
    id: 'varvarka-znamensky-en-v1',
    placeId: 'znamensky-cathedral',
    locale: 'en',
    targetDurationSeconds: 50,
    sourceUrls: [...source.znamensky],
    transcript: 'Znamensky Cathedral helps you read Varvarka as a historical ensemble rather than a row of isolated attractions. The existing cathedral was built in 1679–1684 and became the compositional centre of the Znamensky Monastery, on territory connected with the old Romanov estate. In the twentieth century the building went through alterations and new uses, followed by a major scholarly restoration in 1963–1972. Stop and notice how the cathedral works at the scale of the street: its volume connects the chambers, the former monastery grounds and present-day Zaryadye. Here history is visible not only in facade details, but in the city silhouette itself.'
  }),
  pending({
    id: 'varvarka-znamensky-zh-v1',
    placeId: 'znamensky-cathedral',
    locale: 'zh',
    targetDurationSeconds: 58,
    sourceUrls: [...source.znamensky],
    transcript: '圣母显兆主教座堂让你把瓦尔瓦尔卡理解成一个完整的历史城市组团，而不是一排彼此独立的景点。现存主教座堂建于1679至1684年，成为显兆修道院建筑群的构图中心，这片区域又与罗曼诺夫家族旧宅和皇室历史相连。20世纪，建筑经历过改造和不同用途，1963至1972年又进行了大规模学术修复。停下来看看它在整条街上的尺度：主教座堂的体量把贵族宅邸、原修道院区域和今天的扎里亚季耶联系起来。在这里，历史不仅存在于立面细节中，也存在于整个城市天际线和空间关系里。'
  }),
  pending({
    id: 'varvarka-gates-ru-v1',
    placeId: 'varvarka-gates',
    locale: 'ru',
    targetDurationSeconds: 55,
    sourceUrls: [...source.gates],
    transcript: 'Финальная точка прогулки — место, где Варварка упиралась в укреплённую границу Китай-города. Каменную стену начали строить в 1535 году под руководством Петра Малого, а основание Варваринской башни относится к 1534–1538 годам. В 1930-е городской ландшафт резко изменился: снос башни планировали в 1933 году, а осенью 1934-го разобрали большую часть Китайгородских стен. Но история не исчезла полностью. Нижняя часть Варваринской башни сохраняется как охраняемый памятник и находится в переходе станции метро «Китай-город». Посмотрите на современную площадь и мысленно верните сюда линию стены: маршрут заканчивается буквально на границе одной исчезнувшей Москвы.'
  }),
  pending({
    id: 'varvarka-gates-en-v1',
    placeId: 'varvarka-gates',
    locale: 'en',
    targetDurationSeconds: 55,
    sourceUrls: [...source.gates],
    transcript: 'The final stop is where Varvarka once met the fortified boundary of Kitay-Gorod. Construction of the stone wall began in 1535 under Petrok Maly, and the base of the Varvarinskaya Tower is dated to 1534–1538. The cityscape changed dramatically in the 1930s: demolition of the tower was planned in 1933, and most of the Kitay-Gorod wall was dismantled in autumn 1934. Yet the boundary did not disappear completely. The lower part of the Varvarinskaya Tower survives as protected heritage in the Kitay-Gorod metro passage. Look across the modern square and mentally restore the line of the wall: the walk ends on the edge of a Moscow that has largely vanished.'
  }),
  pending({
    id: 'varvarka-gates-zh-v1',
    placeId: 'varvarka-gates',
    locale: 'zh',
    targetDurationSeconds: 62,
    sourceUrls: [...source.gates],
    transcript: '路线的最后一站，是瓦尔瓦尔卡街过去与基泰戈罗德防御边界相接的地方。石砌城墙从1535年开始建设，瓦尔瓦拉塔的基础通常定年为1534至1538年。20世纪30年代，这一带的城市景观发生巨大变化：1933年已经提出拆除塔楼的计划，1934年秋，大部分基泰戈罗德城墙被拆除。但历史并没有完全消失，瓦尔瓦拉塔的下部基础仍作为受保护遗产保存在基泰戈罗德地铁通道中。站在今天的广场上，试着在脑海中重新画出那条城墙线，你会发现这条步行路线正好结束在一座大部分已经消失的莫斯科城市边界上。'
  }),
];

export function getVarvarkaAudioTrack(placeId: string, locale: VarvarkaAudioLocale) {
  return varvarkaAudioCatalog.find((track) => track.placeId === placeId && track.locale === locale) ?? null;
}

export function getVarvarkaAudioReadiness() {
  const productionReady = varvarkaAudioCatalog.filter(isProductionAudioTrack).length;
  return {
    expectedTracks: varvarkaAudioCatalog.length,
    productionReady,
    recordingPending: varvarkaAudioCatalog.filter((track) => track.status === 'recording-pending').length,
    scriptApproved: varvarkaAudioCatalog.filter((track) => track.status === 'script-approved').length,
    complete: productionReady === varvarkaAudioCatalog.length
  };
}

export function buildWalkAudioPlan(input: {
  placeId: string;
  locale: VarvarkaAudioLocale;
  fallbackTranscript: string;
  displayTitle: string;
}): WalkAudioPlan {
  const track = getVarvarkaAudioTrack(input.placeId, input.locale);
  if (track && isProductionAudioTrack(track) && track.production) {
    return {
      trackId: track.id,
      placeId: input.placeId,
      locale: input.locale,
      mode: 'recorded',
      transcript: track.transcript,
      masterUrl: track.production.masterUrl,
      productionStatus: track.status,
      displayTitle: input.displayTitle
    };
  }

  return {
    trackId: track?.id ?? `fallback-${input.placeId}-${input.locale}`,
    placeId: input.placeId,
    locale: input.locale,
    mode: 'tts-fallback',
    transcript: track?.transcript ?? input.fallbackTranscript,
    productionStatus: track?.status ?? 'script-approved',
    displayTitle: input.displayTitle
  };
}
