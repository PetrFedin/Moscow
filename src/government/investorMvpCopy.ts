import type { AppLanguage } from '../i18n';

export type InvestorMvpCopy = {
  title: string;
  subtitle: string;
  thesis: string;
  tabs: {
    control: string;
    product: string;
    deliverables: string;
    money: string;
    acceptance: string;
    ecosystem: string;
    operations: string;
    contract: string;
  };
  closeLabel: string;
  product: {
    sellKicker: string;
    travelerPath: string[];
    pilotKicker: string;
    pilotTitle: string;
    pilotBody: string;
    pilotScope: string[];
    excludedKicker: string;
    excludedTitle: string;
    excludedBody: string;
    notInMvp: string[];
  };
  deliverables: {
    kicker: string;
    title: string;
    items: Array<{ title: string; body: string }>;
  };
  money: {
    kicker: string;
    title: string;
    paysLabel: string;
    acceptanceLabel: string;
    layers: Array<{ id: string; title: string; paysFor: string; acceptedBy: string }>;
    scaleKicker: string;
    scaleTitle: string;
    scaleBody: string;
    scaleFormula: string[];
  };
  acceptance: {
    kicker: string;
    title: string;
    items: string[];
    nextDecisionKicker: string;
    nextDecision: string;
  };
};

const ru: InvestorMvpCopy = {
  title: 'Москва · туристический цифровой слой',
  subtitle:
    'Один продукт связывает план поездки, билеты и брони, городской контент, проверенную историю, фактическое посещение и операторскую аналитику.',
  thesis:
    'Москва покупает не «ещё одно приложение», а управляемый слой туристического пути: traveler experience + verified heritage + integrations + city operations + evidence.',
  tabs: {
    control: 'Контроль',
    product: 'Продукт',
    deliverables: 'Город получает',
    money: 'За что платит',
    acceptance: 'Приёмка',
    ecosystem: 'Ценность и экономика',
    operations: 'Операции',
    contract: 'Контракт'
  },
  closeLabel: 'Закрыть Investor MVP',
  product: {
    sellKicker: 'ЧТО МЫ ПРОДАЁМ',
    travelerPath: [
      'Собрать поездку по дням: обязательные билеты, брони, места и свободные окна.',
      'Получать единый план дня без подмены provider truth: ручные данные остаются пользовательскими, подтверждённые — provider-confirmed.',
      'Во время прогулки получать исторический слой, аудио, 3D/AR там, где объект прошёл соответствующие gates.',
      'При изменении дня пересобрать свободную часть маршрута, не ломая фиксированные билеты и брони.',
      'После посещения сохранить личную историю Москвы: где был, что видел, где ел и что стоит продолжить.'
    ],
    pilotKicker: 'PILOT SCOPE',
    pilotTitle: 'Варварка — Зарядье',
    pilotBody: 'Небольшой проверяемый контур, на котором можно измерить ценность, стоимость и повторяемость.',
    pilotScope: [
      'Территория: Варварка — Зарядье.',
      '5 точек маршрута и 2 spatial hero objects: Палаты Романовых + Старый Английский двор.',
      'Рабочий traveler flow: план дня → маршрут → исторический experience → фиксация посещения.',
      '20–50 supervised pilot sessions с aggregate-only отчётом.',
      'Один согласованный live/provider integration contour или формально зафиксированный integration handoff.',
      'Измерение фактической стоимости, lead time и трудозатрат следующего verified object.'
    ],
    excludedKicker: 'НЕ В MVP',
    excludedTitle: 'Что сознательно не покупаем сейчас',
    excludedBody: 'Всё, что не помогает доказать туристический путь, production economics или городскую эксплуатацию, остаётся за пределами первого контракта.',
    notInMvp: [
      'Не строим отдельную OTA и собственный платёжный контур.',
      'Не дублируем RUSSPASS / городские каталоги, если есть authoritative integration route.',
      'Не масштабируем city-wide 3D до field proof и repeatability.',
      'Не продаём social network, sponsorship marketplace или «метавселенную Москвы» в первом контракте.',
      'Не показываем недоказанные live availability, исторические реконструкции или field accuracy как факт.',
      'Не продаём федеральное масштабирование до доказанного Moscow reference и первого внешнего региона.'
    ]
  },
  deliverables: {
    kicker: 'ПОСТАВЛЯЕМЫЙ РЕЗУЛЬТАТ',
    title: 'Город получает не презентацию, а работающий набор активов.',
    items: [
      { title: 'Публичный туристический клиент', body: 'iOS / Android / web reference client: поездка по дням, Today, билеты и брони, маршрут, история, offline-safe content и «Моя Москва».' },
      { title: 'Пакет района', body: 'Versioned destination package: точки, маршруты, локализации, verified heritage objects, provider links и publication state.' },
      { title: 'City Heritage Studio', body: 'Рабочий процесс source → rights → historical claim → model/media → review → publish, чтобы цифровой объект не зависел от одного подрядчика.' },
      { title: 'City Journey Control Center', body: 'Операторский слой для состояния маршрутов, provider freshness, evidence, acceptance и проблем, требующих вмешательства.' },
      { title: 'Интеграционные контракты', body: 'API / deep-link / feed boundaries для RUSSPASS и других согласованных городских или коммерческих провайдеров без создания параллельной OTA.' },
      { title: 'Доказательный пакет пилота', body: 'Field evidence, supervised visitor pilot, aggregate analytics, acceptance matrix, production economics и Go / No-Go memo для следующего этапа.' }
    ]
  },
  money: {
    kicker: 'КОММЕРЧЕСКАЯ ЛОГИКА',
    title: 'Платёж привязан к поставляемому слою и его приёмке.',
    paysLabel: 'ЗА ЧТО ПЛАТИТ ГОРОД',
    acceptanceLabel: 'КАК ПРИНИМАЕТСЯ',
    layers: [
      { id: 'pilot', title: '1 · Доказательный пилот', paysFor: 'Ограниченный scope Варварки, production двух hero objects, полевой proof, user pilot, интеграционный контур и итоговый evidence pack.', acceptedBy: 'Согласованная матрица критериев пилота. Сам статус пилота не равен автоматическому масштабированию.' },
      { id: 'platform', title: '2 · Платформа и эксплуатация', paysFor: 'После успешного пилота: лицензирование/эксплуатация client + Studio + Control Center, hosting, monitoring, support и обновления.', acceptedBy: 'SLA, security/data-flow, release governance и эксплуатационные KPI.' },
      { id: 'district', title: '3 · Новый район / destination pack', paysFor: 'Shared setup района + интеграция + производство и верификация согласованного количества объектов и маршрутов.', acceptedBy: 'Published destination package, прошедшие gates объекты и формальная приёмка контента/прав/интеграций.' },
      { id: 'integration', title: '4 · Интеграции и развитие', paysFor: 'Новые provider adapters, городские data contracts, новые сценарии и change requests, которые не входят в базовый scope.', acceptedBy: 'Конкретный API/data contract, тестовый evidence и agreed acceptance для каждой интеграции.' }
    ],
    scaleKicker: 'ФОРМУЛА МАСШТАБА',
    scaleTitle: 'Цена следующего этапа строится из измеренных компонент',
    scaleBody: 'Никаких выдуманных TAM/ROI вместо себестоимости и фактического production evidence.',
    scaleFormula: [
      'Pilot = fixed scope + agreed acceptance.',
      'District delivery = shared setup + integration + N × measured verified-object cost.',
      'Run = annual platform / operations + provider maintenance.',
      'Никакой «федеральной цены» и ROI не заявляем до реальных Moscow proof и measured economics.'
    ]
  },
  acceptance: {
    kicker: 'КРИТЕРИИ ПРИЁМКИ',
    title: 'Пилот должен закрыть неопределённости, а не создать ещё одну демонстрацию.',
    items: [
      'Пользовательский путь работает на заявленных целевых клиентах и не показывает demo/live данные как реальные.',
      'Любой spatial/AR showcase проходит собственные field gates до заявления точности.',
      'Ни один конкретный район или объект не является обязательной географией широкого MVP.',
      'Туристический, партнёрский и городской контуры демонстрируются независимо от доступности отдельных provider/field интеграций.',
      'Provider / integration truth отделена от пользовательских ручных данных и имеет freshness / evidence boundary.',
      'Город получает формальный handover: код/контракты/документация/права/операционная модель в согласованном объёме.'
    ],
    nextDecisionKicker: 'СЛЕДУЮЩЕЕ РЕШЕНИЕ',
    nextDecision: 'Согласовать профильного owner задачи, пилотную площадку, integration/data owner и рабочую сессию по scope + acceptance + правовой форме пилота.'
  }
};

const en: InvestorMvpCopy = {
  title: 'Moscow · digital visitor journey layer',
  subtitle: 'One product connects trip planning, tickets and reservations, city content, verified history, actual visits and operator analytics.',
  thesis: 'Moscow is not buying “another app”. It is buying a governed visitor-journey layer: traveler experience + verified heritage + integrations + city operations + evidence.',
  tabs: { control: 'Control', product: 'Product', deliverables: 'City receives', money: 'What is paid for', acceptance: 'Acceptance', ecosystem: 'Value & economics', operations: 'Operations', contract: 'Contract' },
  closeLabel: 'Close Investor MVP',
  product: {
    sellKicker: 'WHAT WE SELL',
    travelerPath: [
      'Build the trip by day around fixed tickets, reservations, places and free time windows.',
      'Use one day plan without upgrading user-entered data into provider-confirmed truth.',
      'Receive historical context, audio and 3D/AR only where the corresponding object has passed its gates.',
      'Replan the flexible part of the day without breaking fixed tickets and reservations.',
      'Keep a personal Moscow history after the visit: where the traveler went, what they saw, where they ate and what to continue.'
    ],
    pilotKicker: 'REFERENCE MVP',
    pilotTitle: 'Moscow as one city trip product',
    pilotBody: 'A broad reference MVP demonstrates the full trip lifecycle, partner economics and city demand/load layer; specific districts and objects are replaceable demo scenarios.',
    pilotScope: [
      'Multi-day Trip OS: dates, interests, pace, accessibility, must-sees, tickets and reservations.',
      'Today: fixed commitments, free windows, nearby opportunities and adaptive replan.',
      'Broad taxonomy: museums, events, theatre, food, nightlife, parks, shopping, stay and transport.',
      'My Moscow: actual visit memory and recommendations focused on what remains new.',
      'Partner flow: supply → offer → handoff → confirmation/attribution → revenue evidence.',
      'City layer: demand gaps, load balancing, event/district opportunity and aggregate tourism intelligence.'
    ],
    excludedKicker: 'OUT OF MVP',
    excludedTitle: 'What the first contract deliberately does not buy',
    excludedBody: 'Anything that does not help prove the visitor journey, production economics or city operations stays outside the first contract.',
    notInMvp: [
      'No separate OTA or proprietary payment core.',
      'No duplication of RUSSPASS / city catalogues where an authoritative integration route exists.',
      'No city-wide 3D scale before field proof and repeatability.',
      'No social network, sponsorship marketplace or “Moscow metaverse” in the first contract.',
      'No unproven live availability, reconstruction or field accuracy presented as fact.',
      'No federal-scale sale before a proven Moscow reference and first external region.'
    ]
  },
  deliverables: {
    kicker: 'DELIVERABLES',
    title: 'The city receives working assets, not a presentation.',
    items: [
      { title: 'Public visitor client', body: 'iOS / Android / web reference client: trip by days, Today, tickets and reservations, route, history, offline-safe content and My Moscow.' },
      { title: 'District package', body: 'Versioned destination package: places, routes, localisations, verified heritage objects, provider links and publication state.' },
      { title: 'City Heritage Studio', body: 'Source → rights → historical claim → model/media → review → publish workflow so a digital object is not locked to one contractor.' },
      { title: 'City Journey Control Center', body: 'Operator layer for route state, provider freshness, evidence, acceptance and intervention issues.' },
      { title: 'Integration contracts', body: 'API / deep-link / feed boundaries for RUSSPASS and other agreed city or commercial providers without creating a parallel OTA.' },
      { title: 'Pilot evidence pack', body: 'Field evidence, supervised visitor pilot, aggregate analytics, acceptance matrix, production economics and a Go / No-Go memo for the next stage.' }
    ]
  },
  money: {
    kicker: 'COMMERCIAL LOGIC',
    title: 'Payment is tied to a deliverable layer and its acceptance.',
    paysLabel: 'WHAT THE CITY PAYS FOR',
    acceptanceLabel: 'HOW IT IS ACCEPTED',
    layers: [
      { id: 'pilot', title: '1 · Evidence pilot', paysFor: 'Bounded Varvarka scope, production of two hero objects, field proof, user pilot, integration contour and final evidence pack.', acceptedBy: 'Agreed pilot acceptance matrix. Pilot status does not automatically approve scale.' },
      { id: 'platform', title: '2 · Platform and operations', paysFor: 'After a successful pilot: client + Studio + Control Center licensing/operations, hosting, monitoring, support and updates.', acceptedBy: 'SLA, security/data-flow, release governance and operational KPIs.' },
      { id: 'district', title: '3 · New district / destination pack', paysFor: 'District shared setup + integration + production and verification of an agreed number of objects and routes.', acceptedBy: 'Published destination package, objects that passed gates, and formal content/rights/integration acceptance.' },
      { id: 'integration', title: '4 · Integrations and development', paysFor: 'New provider adapters, city data contracts, new scenarios and change requests outside the base scope.', acceptedBy: 'A specific API/data contract, test evidence and agreed acceptance for each integration.' }
    ],
    scaleKicker: 'SCALE FORMULA',
    scaleTitle: 'The next-stage price is built from measured components',
    scaleBody: 'No invented TAM/ROI in place of actual cost and production evidence.',
    scaleFormula: [
      'Pilot = fixed scope + agreed acceptance.',
      'District delivery = shared setup + integration + N × measured verified-object cost.',
      'Run = annual platform / operations + provider maintenance.',
      'No “federal price” or ROI claim before real Moscow proof and measured economics.'
    ]
  },
  acceptance: {
    kicker: 'ACCEPTANCE CRITERIA',
    title: 'The pilot must remove uncertainty, not create another demo.',
    items: [
      'The visitor journey works on the declared target clients and never presents demo/live data as real.',
      'Any spatial/AR showcase passes its own field gates before accuracy is claimed.',
      'No single district or object is mandatory geography for the broad MVP.',
      'Traveler, partner and city layers remain demonstrable independently from individual provider/field integrations.',
      'Provider/integration truth is separated from user-entered data and has freshness/evidence boundaries.',
      'The city receives the agreed handover: code/contracts/documentation/rights/operating model.'
    ],
    nextDecisionKicker: 'NEXT DECISION',
    nextDecision: 'Agree the business owner, pilot site, integration/data owner and a working session on scope + acceptance + legal form of the pilot.'
  }
};

const zh: InvestorMvpCopy = {
  title: '莫斯科 · 数字游客旅程层',
  subtitle: '一个产品连接行程规划、门票与预订、城市内容、经核验的历史信息、实际到访记录和运营分析。',
  thesis: '莫斯科购买的不是“又一个应用”，而是一套可治理的游客旅程层：游客体验 + 经核验的文化遗产 + 集成 + 城市运营 + 证据。',
  tabs: { control: '总览', product: '产品', deliverables: '城市获得', money: '付费内容', acceptance: '验收', ecosystem: '价值与经济', operations: '运营', contract: '合同' },
  closeLabel: '关闭 Investor MVP',
  product: {
    sellKicker: '我们提供什么',
    travelerPath: [
      '按天规划行程，把固定门票、预订、地点和空闲时段放入同一计划。',
      '形成统一日程，但不会把用户手工录入的信息冒充为服务商已确认数据。',
      '只有在对象通过相应审核后，才提供历史层、音频以及 3D/AR 体验。',
      '当计划变化时，只重排灵活部分，不破坏固定门票和预订。',
      '访问后保留个人莫斯科足迹：去过哪里、看过什么、在哪里用餐以及下一步值得继续什么。'
    ],
    pilotKicker: 'REFERENCE MVP',
    pilotTitle: '把莫斯科作为一个完整的城市旅行产品',
    pilotBody: '宽口径 reference MVP 展示完整旅行生命周期、合作伙伴经济与城市需求/客流层；具体区域和对象只是可替换的演示场景。',
    pilotScope: [
      '多日 Trip OS：日期、兴趣、节奏、无障碍意图、必看、门票和预订。',
      'Today：固定计划、空闲时段、附近机会和动态重排。',
      '广泛分类：博物馆、活动、剧院、美食、夜生活、公园、购物、住宿和交通。',
      'My Moscow：真实到访历史，只推荐尚未体验的内容。',
      'Partner flow：供给 → offer → handoff → confirmation/attribution → revenue evidence。',
      'City layer：需求缺口、客流平衡、活动/区域机会和聚合旅游智能。'
    ],
    excludedKicker: 'MVP 不包含',
    excludedTitle: '首份合同明确不购买的内容',
    excludedBody: '凡不能帮助验证游客旅程、生产经济性或城市运营的内容，都不进入首份合同。',
    notInMvp: [
      '不建设独立 OTA 或自有支付核心。',
      '存在权威集成路径时，不重复建设 RUSSPASS / 城市目录。',
      '在现场验证和可复制性完成前，不扩展全城 3D。',
      '首份合同不包含社交网络、赞助市场或“莫斯科元宇宙”。',
      '不把未经证明的实时可用性、历史重建或现场精度当作事实。',
      '在莫斯科 reference 和首个外部地区得到验证前，不销售联邦级扩展。'
    ]
  },
  deliverables: {
    kicker: '交付成果',
    title: '城市获得的是可运行资产，而不是演示文稿。',
    items: [
      { title: '公共游客客户端', body: 'iOS / Android / web reference client：按天行程、Today、门票与预订、路线、历史、离线安全内容和“我的莫斯科”。' },
      { title: '区域包', body: '版本化 destination package：地点、路线、本地化、经核验文化遗产对象、服务商链接和发布状态。' },
      { title: 'City Heritage Studio', body: 'source → rights → historical claim → model/media → review → publish 的工作流，避免数字对象被单一承包商锁定。' },
      { title: 'City Journey Control Center', body: '用于路线状态、服务商数据新鲜度、证据、验收和异常处置的运营层。' },
      { title: '集成契约', body: '面向 RUSSPASS 及其他经同意的城市或商业服务商的 API / deep-link / feed 边界，不另建平行 OTA。' },
      { title: '试点证据包', body: '现场证据、受监督游客试点、汇总分析、验收矩阵、生产经济性以及下一阶段 Go / No-Go 备忘录。' }
    ]
  },
  money: {
    kicker: '商业逻辑',
    title: '付款与明确的交付层及其验收条件绑定。',
    paysLabel: '城市为什么付费',
    acceptanceLabel: '如何验收',
    layers: [
      { id: 'pilot', title: '1 · 证据型试点', paysFor: '有限的瓦尔瓦尔卡范围、两个核心对象的制作、现场验证、用户试点、集成链路和最终证据包。', acceptedBy: '依据双方确认的试点验收矩阵。试点完成并不自动批准扩展。' },
      { id: 'platform', title: '2 · 平台与运营', paysFor: '试点成功后：client + Studio + Control Center 的许可/运营、托管、监控、支持和更新。', acceptedBy: 'SLA、安全/数据流、发布治理和运营 KPI。' },
      { id: 'district', title: '3 · 新区域 / destination pack', paysFor: '区域 shared setup + 集成 + 约定数量对象和路线的制作与核验。', acceptedBy: '已发布 destination package、通过 gates 的对象，以及内容/权利/集成的正式验收。' },
      { id: 'integration', title: '4 · 集成与发展', paysFor: '新的 provider adapters、城市数据契约、新场景及基础范围外的变更需求。', acceptedBy: '针对每个集成项的 API/data contract、测试证据和双方确认的验收条件。' }
    ],
    scaleKicker: '规模化公式',
    scaleTitle: '下一阶段价格只基于已测量的组成部分',
    scaleBody: '不以虚构的 TAM/ROI 代替实际成本和生产证据。',
    scaleFormula: [
      'Pilot = fixed scope + agreed acceptance.',
      'District delivery = shared setup + integration + N × measured verified-object cost.',
      'Run = annual platform / operations + provider maintenance.',
      '在真实的 Moscow proof 和 measured economics 之前，不声明“联邦价格”或 ROI。'
    ]
  },
  acceptance: {
    kicker: '验收标准',
    title: '试点必须消除不确定性，而不是再产生一个演示版本。',
    items: [
      '游客旅程在声明的目标客户端上可运行，并且绝不把 demo/live 数据冒充真实数据。',
      '任何 spatial/AR showcase 在宣称精度前必须通过自身 field gate。',
      '任何单一区域或对象都不是宽口径 MVP 的强制地理范围。',
      '游客、合作伙伴与城市层可独立于单个 provider/field integration 进行完整演示。',
      '服务商/集成事实与用户手工数据分离，并具有 freshness / evidence 边界。',
      '城市获得约定范围内的正式交接：代码/契约/文档/权利/运营模式。'
    ],
    nextDecisionKicker: '下一步决策',
    nextDecision: '确定业务负责人、试点场地、集成/数据负责人，并就 scope + acceptance + 试点法律形式召开工作会议。'
  }
};

export function getInvestorMvpCopy(language: AppLanguage): InvestorMvpCopy {
  if (language === 'en') return en;
  if (language === 'zh') return zh;
  return ru;
}
