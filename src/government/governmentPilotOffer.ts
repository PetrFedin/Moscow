export type GovernmentProofStatus =
  | 'implemented'
  | 'external-proof-required'
  | 'partner-access-required'
  | 'future-stage';

export type GovernmentProofItem = {
  id: string;
  title: string;
  status: GovernmentProofStatus;
  evidence: string;
  nextGate: string;
};

export type GovernmentFundingTrack = {
  id: string;
  title: string;
  role: string;
  status: 'candidate-route' | 'post-pilot-route';
  note: string;
};

export type GovernmentScaleStage = {
  id: string;
  title: string;
  outcome: string;
  gate: string;
};

export type GovernmentPilotOffer = {
  title: string;
  subtitle: string;
  positioning: string;
  pilot: {
    name: string;
    territory: string;
    scope: string[];
    outputs: string[];
  };
  proof: GovernmentProofItem[];
  cityAsk: string[];
  cityValue: string[];
  commercialModel: string[];
  fundingTracks: GovernmentFundingTrack[];
  scale: GovernmentScaleStage[];
  guardrails: string[];
};

export const governmentPilotOffer: GovernmentPilotOffer = {
  title: 'Москва во времени',
  subtitle: 'Городской стандарт цифрового исторического объекта и туристического пути',
  positioning:
    'Не ещё одно экскурсионное приложение, а повторно используемая городская инфраструктура: источник → права → реконструкция → 3D → spatial proof → маршрут → live-данные → аналитика → масштабирование.',
  pilot: {
    name: 'Варварка во времени',
    territory: 'Варварка — Зарядье',
    scope: [
      '5 точек исторического маршрута',
      '2 spatial hero objects: Палаты Романовых + Старый Английский двор',
      'RU / EN / ZH, аудио, offline content, accessibility',
      '20–50 участников supervised usability pilot',
      'интеграционный контур для RUSSPASS / городских provider feeds без дублирования существующих сервисов'
    ],
    outputs: [
      'два versioned PublishedSpatialPackage с доказательным контуром',
      'City Heritage Studio workflow: source / rights / claim / model / review / publish',
      'измеримый visitor journey и aggregate-only pilot report',
      'Live Destination Authority + provider integration contract',
      'матрица приёмки и evidence bundle',
      'фактическая оценка стоимости и срока следующего объекта/района'
    ]
  },
  proof: [
    {
      id: 'platform-contracts',
      title: 'Heritage / Studio / publication contracts',
      status: 'implemented',
      evidence: 'PublishedSpatialPackage, City Heritage Studio, source/rights/review authority находятся в коде и contract tests.',
      nextGate: 'Использовать эти authority в реальном городском пилоте.'
    },
    {
      id: 'mobile-journey',
      title: 'Mobile journey · карта · маршрут · audio · 3D/AR runtime',
      status: 'implemented',
      evidence: 'Web/iOS/Android exports и browser E2E проходят quality pipeline.',
      nextGate: 'Полевой QA на физических устройствах и production distribution.'
    },
    {
      id: 'romanov',
      title: 'Палаты Романовых · spatial proof',
      status: 'external-proof-required',
      evidence: 'Software release gate и field-evidence contracts готовы.',
      nextGate: 'Реальный field day: 2 iOS + 2 Android, 5/10/15 м, survey, residual и independent anchor resolve.'
    },
    {
      id: 'old-english-court',
      title: 'Старый Английский двор · повторяемость pipeline',
      status: 'external-proof-required',
      evidence: 'Generic metric/control authority и self-contained submission v2 готовы.',
      nextGate: 'Получить реальный GLB + provenance/rights/metric evidence + survey и пройти тот же pipeline без Romanov-specific исключений.'
    },
    {
      id: 'visitor-pilot',
      title: 'Варварка · пользовательское доказательство',
      status: 'external-proof-required',
      evidence: 'Privacy-safe analytics, cohort rollup и operational study pack на 20–50 участников готовы.',
      nextGate: 'Провести реальные сессии и получить final-study-report.json.'
    },
    {
      id: 'live-destination',
      title: 'Live Destination Authority',
      status: 'partner-access-required',
      evidence: 'Provider capabilities, freshness, booking handoff, snapshot audit и fail-closed ingestion готовы.',
      nextGate: 'Формальный provider/feed access: RUSSPASS/городской контур или другой согласованный источник.'
    },
    {
      id: 'federal',
      title: 'Федеральный тираж',
      status: 'future-stage',
      evidence: 'DestinationPackage и generic contracts не привязаны к Москве как единственному региону.',
      nextGate: 'Сначала доказать Москву как reference city, затем подключить первый внешний регион.'
    }
  ],
  cityAsk: [
    'Назначить профильного владельца задачи и площадку пилота.',
    'Согласовать предмет, методологию, график и критерии приёмки пилота.',
    'Обеспечить доступ к объектам/учреждениям и экспертам по истории, правам и полевому тестированию.',
    'Дать формальный интеграционный контакт и, при возможности, sandbox/feed для RUSSPASS или другого городского tourism-data контура.',
    'Помочь провести supervised visitor pilot на 20–50 участниках без смешения исследовательских данных с персональными данными приложения.',
    'Определить допустимый механизм финансирования первого этапа отдельно: пилотная поддержка, договор, закупка, лицензия или иной применимый контур.',
    'После отчёта пилота принять отдельное Go / No-Go решение о внедрении и масштабировании.'
  ],
  cityValue: [
    'Один проверяемый цифровой объект можно повторно использовать в мобильном приложении, AR/VR, музеях, маршрутах и образовательных сценариях.',
    'Историческая достоверность, права и версия модели становятся auditable, а не зависят от конкретного подрядчика или презентации.',
    'Новый район подключается по тому же production standard, а не через новый одноразовый проект.',
    'Live data интегрируется через provider authority и не превращает старые справочники в ложное “открыто сейчас”.',
    'Город получает измеримый visitor funnel и стоимость производства следующего объекта/района.',
    'Интеграция с существующими городскими каналами предпочтительнее создания конкурирующего каталога.'
  ],
  commercialModel: [
    'Первый доказательный пилот — отдельный ограниченный этап с фиксированным scope и evidence-based приёмкой.',
    'Далее: лицензирование/эксплуатация платформы и Studio, интеграция и сопровождение.',
    'Отдельно тарифицируется производство и верификация новых heritage objects / district packs.',
    'Региональное подключение — onboarding + content/spatial production + integration + support.',
    'Коммерческие партнёры могут финансировать маршруты/сезоны/контент, но sponsorship не влияет на историческую truth authority и editorial ranking.'
  ],
  fundingTracks: [
    {
      id: 'moscow-pilot',
      title: 'Москва · пилот инновационного решения',
      role: 'Фонд МИК / городской pilot track + профильная площадка',
      status: 'candidate-route',
      note: 'Подходящий вход для формализованной апробации; конкретное финансирование не возникает автоматически и согласуется отдельно.'
    },
    {
      id: 'profile-deployment',
      title: 'Москва · профильное внедрение',
      role: 'Профильный заказчик / учреждение / городской цифровой контур',
      status: 'post-pilot-route',
      note: 'После положительного пилота определяется применимый договорный, закупочный, лицензионный или иной механизм.'
    },
    {
      id: 'investment',
      title: 'Инвестиционный контур',
      role: 'Инвестиционные сервисы МИК / Московский венчурный фонд / частные соинвесторы',
      status: 'post-pilot-route',
      note: 'Рассматривать после появления physical proof, user proof, понятной unit economics и прав на результат.'
    },
    {
      id: 'federal-tourism',
      title: 'Федеральный контур',
      role: 'Нацпроект «Туризм и гостеприимство» / госпрограмма «Развитие туризма» / регионы',
      status: 'post-pilot-route',
      note: 'Не обещание субсидии. После московского proof проект можно позиционировать как цифровой стандарт/experience layer для региональных и межрегиональных маршрутов.'
    }
  ],
  scale: [
    {
      id: 'moscow-pilot',
      title: '1 · Варварка',
      outcome: 'Доказать технологию, повторяемость, visitor value и реальную стоимость production.',
      gate: 'Romanov + OEC + 20–50 visitor sessions.'
    },
    {
      id: 'moscow-district',
      title: '2 · Район Москвы',
      outcome: '10–30 объектов, City Heritage Studio, интеграция в городские каналы.',
      gate: 'Следующий объект производится по измеренному standard без bespoke-разработки.'
    },
    {
      id: 'moscow-standard',
      title: '3 · Москва',
      outcome: 'Единый city standard цифрового heritage object и destination journey.',
      gate: 'Несколько районов и учреждений публикуют через общий governance workflow.'
    },
    {
      id: 'first-region',
      title: '4 · Первый внешний регион',
      outcome: 'Доказать, что платформа не является Moscow-only.',
      gate: 'Регион подключается через тот же contract и получает собственный governance/content layer.'
    },
    {
      id: 'federal',
      title: '5 · Межрегиональный / федеральный слой',
      outcome: 'Стандарт подключения регионов + journey/orchestration + verified heritage infrastructure.',
      gate: 'Межрегиональный proof, согласованные интеграции и отдельный федеральный механизм.'
    }
  ],
  guardrails: [
    'Не называть Romanov field-verified до реального физического evidence.',
    'Не обещать бюджет, субсидию, закупку или инвестиции до отдельного официального решения.',
    'Не выдавать supervised pilot за репрезентативное исследование туристов Москвы.',
    'Не конкурировать с RUSSPASS/«Узнай Москву» там, где выгоднее интеграция.',
    'Не масштабировать на регионы до доказанной unit economics следующего объекта и repeatability.'
  ]
};

export function getGovernmentPilotReadiness(offer: GovernmentPilotOffer = governmentPilotOffer) {
  const implemented = offer.proof.filter((item) => item.status === 'implemented').length;
  const externalProofRequired = offer.proof.filter((item) => item.status === 'external-proof-required').length;
  const partnerAccessRequired = offer.proof.filter((item) => item.status === 'partner-access-required').length;
  const futureStage = offer.proof.filter((item) => item.status === 'future-stage').length;

  return {
    total: offer.proof.length,
    implemented,
    externalProofRequired,
    partnerAccessRequired,
    futureStage,
    pilotProven: externalProofRequired === 0 && partnerAccessRequired === 0
  };
}
