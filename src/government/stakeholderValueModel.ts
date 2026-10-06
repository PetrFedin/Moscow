export type StakeholderId =
  | 'traveler'
  | 'city'
  | 'heritage'
  | 'commercial-partner'
  | 'integration-partner'
  | 'financial-investor';

export type Maturity = 'mvp' | 'post-pilot' | 'scale';

export type StakeholderValue = {
  id: StakeholderId;
  maturity: Maturity;
  currentValue: string[];
  futureValue: string[];
  givesPlatform: string[];
  successEvidence: string[];
};

export type RevenueEngineId =
  | 'government-pilot'
  | 'platform-license'
  | 'district-production'
  | 'partner-console'
  | 'provider-attribution'
  | 'sponsored-experience'
  | 'destination-intelligence'
  | 'regional-license'
  | 'api-sdk';

export type RevenueEngine = {
  id: RevenueEngineId;
  maturity: Maturity;
  payer: 'city' | 'institution' | 'commercial-partner' | 'provider' | 'region';
  chargeBasis: string;
  valueCreated: string;
  evidenceRequiredBeforePricing: string[];
  guardrails: string[];
};

export const stakeholderValues: StakeholderValue[] = [
  {
    id: 'traveler',
    maturity: 'mvp',
    currentValue: [
      'Один план поездки по дням вместо разрозненных заметок, билетов, броней и списков мест.',
      'Фиксированные билеты и брони не ломаются при перепланировании свободной части дня.',
      'Исторический слой, аудио и spatial experience отделяют подтверждённые факты от реконструкции.',
      'Moscow Passport сохраняет личную историю: где был, что видел, где ел и что стоит продолжить.'
    ],
    futureValue: [
      'Единый wallet городских билетов и бронирований через provider-confirmed integrations.',
      'Персональный маршрут на основе интересов, времени, доступности, погоды и фактической загруженности.',
      'Перенос личного city graph между районами и будущими destination packs.',
      'Привилегии партнёров только при явном согласии пользователя и без продажи персональных данных.'
    ],
    givesPlatform: [
      'Privacy-safe события journey: start / visit / complete / continue / provider handoff.',
      'Агрегированный сигнал о том, какие маршруты, темы и временные окна реально востребованы.',
      'Добровольные сохранения, предпочтения и оценки, если пользователь их предоставляет.'
    ],
    successEvidence: [
      'Journey completion.',
      'Route continuation.',
      'Cultural reach.',
      'Heritage engagement.',
      'Provider handoff without false transaction confirmation.'
    ]
  },
  {
    id: 'city',
    maturity: 'mvp',
    currentValue: [
      'Проверяемый цифровой туристический путь вместо набора несвязанных showcase-функций.',
      'City Heritage Studio и evidence-driven публикация культурного контента.',
      'Control Center: provider freshness, blockers, acceptance и управляемый handover.',
      'Понимание фактической себестоимости следующего объекта и района.'
    ],
    futureValue: [
      'Единый стандарт destination packages для районов и учреждений.',
      'Aggregate destination intelligence для управления потоками и программами развития.',
      'Повторное использование verified heritage assets в городских каналах, музеях и образовании.',
      'Возможность закупать новые районы по измеренной unit economics вместо bespoke-проектов.'
    ],
    givesPlatform: [
      'Профильный owner задачи и governance.',
      'Доступ к объектам, учреждениям, rights/content authorities и согласованным данным.',
      'Интеграционный маршрут к городским системам и формальную процедуру приёмки.'
    ],
    successEvidence: [
      'Accepted pilot evidence pack.',
      'Measured production economics.',
      'Formal handover.',
      'Security / rights / SLA governance.',
      'Decision-ready district scale pack.'
    ]
  },
  {
    id: 'heritage',
    maturity: 'mvp',
    currentValue: [
      'Версионируемый цифровой объект с источниками, правами, claims и review trail.',
      'Отделение документированного факта от реконструкции и гипотезы.',
      'Повторное использование материалов в mobile / web / museum / education сценариях.'
    ],
    futureValue: [
      'Institution workspace для публикации и обновления собственных объектов без bespoke-разработки.',
      'Собственные тематические маршруты, коллекции и событийные слои.',
      'Измеримая вовлечённость посетителей без передачи учреждениям персональных данных туристов.'
    ],
    givesPlatform: [
      'Источники, экспертизу, rights clearance и content review.',
      'Доступ к объекту и участие в field verification.',
      'Institution hours, необходимые для реальной unit economics.'
    ],
    successEvidence: [
      'Publication-rights clearance.',
      'Accepted historical claims.',
      'Verified asset package.',
      'Measured institution hours / object.'
    ]
  },
  {
    id: 'commercial-partner',
    maturity: 'post-pilot',
    currentValue: [
      'В MVP партнёр может быть authoritative destination/provider endpoint, а не рекламной карточкой.',
      'Переход пользователя к билету, столу, событию или размещению фиксируется как handoff без ложного статуса покупки.'
    ],
    futureValue: [
      'Partner Console: verified profile, offers, availability feed, deep links, campaigns and attribution.',
      'Попадание в релевантный момент маршрута по пользовательскому намерению, а не по покупке позиции в редакционном ranking.',
      'Aggregate demand signals: районы, категории, временные окна, route-to-handoff conversion.',
      'Совместные пакеты “маршрут + музей + ресторан + событие” через согласованные provider contracts.'
    ],
    givesPlatform: [
      'Актуальные availability / booking / ticket feeds.',
      'Коммерческие условия по attribution или subscription после отдельного договора.',
      'Сервисную ответственность за фактическую услугу и корректность inventory.'
    ],
    successEvidence: [
      'Provider freshness SLA.',
      'Handoff attribution.',
      'Conversion confirmed by provider where contractually available.',
      'No paid influence on heritage truth or editorial ranking.'
    ]
  },
  {
    id: 'integration-partner',
    maturity: 'post-pilot',
    currentValue: [
      'Ясный API/deep-link contract и fail-closed truth boundary.',
      'Отсутствие необходимости отдавать приложению полномочия подтверждать транзакцию без provider receipt.'
    ],
    futureValue: [
      'Reusable certified adapter contract для подключения новых inventory/providers.',
      'Дополнительный distribution channel и qualified demand из городского journey.',
      'Совместимые destination packages вместо одноразовых интеграций.'
    ],
    givesPlatform: [
      'Authoritative inventory/state.',
      'Receipts/webhooks или иной подтверждённый transaction state.',
      'Sandbox и production integration authority.'
    ],
    successEvidence: [
      'Freshness and availability proof.',
      'Provider-confirmed terminal receipt.',
      'Adapter conformance tests.',
      'Operational incident ownership.'
    ]
  },
  {
    id: 'financial-investor',
    maturity: 'post-pilot',
    currentValue: [
      'Инвестор видит не абстрактный TAM, а evidence-gated путь: pilot → economics → district → platform.',
      'Каждый revenue engine имеет payer, charge basis, доказательство и ограничения.',
      'Нельзя выдать будущую транзакционную модель за существующую выручку.'
    ],
    futureValue: [
      'Рост доли повторяемой платформенной выручки относительно разового production.',
      'Снижение marginal cost нового района после стандартизации Studio / adapters / destination packages.',
      'Расширение B2G → B2B partner tools → regional licensing → API/SDK без смены core platform.',
      'Data/network effect строится на aggregate demand + partner coverage + verified city graph, а не на продаже пользовательских данных.'
    ],
    givesPlatform: [
      'Капитал на доказанный следующий этап, а не на бесконечный feature build.',
      'Доступ к стратегическим партнёрам и каналам масштабирования.',
      'Governance по unit economics, recurring revenue и capital efficiency.'
    ],
    successEvidence: [
      'Measured CAC/payback only after a real commercial acquisition channel exists.',
      'Recurring revenue mix.',
      'Gross contribution by revenue engine.',
      'District production cost trend.',
      'Partner retention / provider coverage.',
      'Regional onboarding repeatability.'
    ]
  }
];

export const revenueEngines: RevenueEngine[] = [
  {
    id: 'government-pilot',
    maturity: 'mvp',
    payer: 'city',
    chargeBasis: 'Фиксированный bounded scope + agreed acceptance.',
    valueCreated: 'Доказательство технологии, visitor value, repeatability и measured economics.',
    evidenceRequiredBeforePricing: [
      'Согласованный scope.',
      'Acceptance matrix.',
      'Ресурсный план и права на pilot assets.'
    ],
    guardrails: ['Цена не является автоматически ценой масштабирования.']
  },
  {
    id: 'platform-license',
    maturity: 'post-pilot',
    payer: 'city',
    chargeBasis: 'Годовая лицензия / эксплуатация / support выбранного production contour.',
    valueCreated: 'Client + Studio + Control Center + release governance + operations.',
    evidenceRequiredBeforePricing: [
      'Выбранный hosting/deployment contour.',
      'SLA.',
      'Фактические support и operations inputs.'
    ],
    guardrails: ['Не объявляется recurring revenue до подписанного договора.']
  },
  {
    id: 'district-production',
    maturity: 'post-pilot',
    payer: 'city',
    chargeBasis: 'Shared setup + integration + N × measured verified-object cost.',
    valueCreated: 'Новый destination pack и verified heritage objects.',
    evidenceRequiredBeforePricing: [
      'Measured next-object cost.',
      'Measured lead time.',
      'Developer / institution hours.',
      'District setup / integration inputs.'
    ],
    guardrails: ['Никаких произвольных per-object цен до второго независимого объекта.']
  },
  {
    id: 'partner-console',
    maturity: 'scale',
    payer: 'commercial-partner',
    chargeBasis: 'Subscription / verified business tooling tier.',
    valueCreated: 'Availability, offers, attribution, campaign tools and aggregate insights.',
    evidenceRequiredBeforePricing: [
      'Partner workflow pilot.',
      'Retention/value study.',
      'Support cost.'
    ],
    guardrails: [
      'Оплата не покупает историческую truth authority.',
      'Оплата не гарантирует editorial ranking.'
    ]
  },
  {
    id: 'provider-attribution',
    maturity: 'scale',
    payer: 'provider',
    chargeBasis: 'Contracted CPA/CPS/revenue-share или иной attribution fee.',
    valueCreated: 'Qualified handoff from planned journey to authoritative transaction provider.',
    evidenceRequiredBeforePricing: [
      'Provider-confirmed attribution.',
      'Commercial agreement.',
      'Reconciliation and refund rules.'
    ],
    guardrails: [
      'Не считать handoff продажей без provider receipt.',
      'Не смешивать городской neutral layer с непрозрачным paid ranking.'
    ]
  },
  {
    id: 'sponsored-experience',
    maturity: 'scale',
    payer: 'commercial-partner',
    chargeBasis: 'Clearly labelled sponsorship package / seasonal route / activation.',
    valueCreated: 'Brand-funded experience with measurable, explicitly labelled exposure.',
    evidenceRequiredBeforePricing: [
      'Audience delivery definition.',
      'Brand-safety rules.',
      'Measurement contract.'
    ],
    guardrails: [
      'Sponsorship маркируется.',
      'Спонсор не меняет historical claims и evidence.',
      'Спонсор не получает скрытый editorial priority.'
    ]
  },
  {
    id: 'destination-intelligence',
    maturity: 'scale',
    payer: 'institution',
    chargeBasis: 'Subscription/reporting for aggregate operational and demand intelligence.',
    valueCreated: 'Privacy-safe understanding of journey demand, route completion and destination usage.',
    evidenceRequiredBeforePricing: [
      'Privacy/legal review.',
      'Minimum aggregation thresholds.',
      'Proven buyer workflow.'
    ],
    guardrails: [
      'Не продавать персональные данные.',
      'Не строить индивидуальный surveillance profile для коммерческого партнёра.'
    ]
  },
  {
    id: 'regional-license',
    maturity: 'scale',
    payer: 'region',
    chargeBasis: 'Regional onboarding + platform license + content/integration production.',
    valueCreated: 'Reuse of the Moscow-proven platform with local governance and destination packages.',
    evidenceRequiredBeforePricing: [
      'Moscow decision-ready pack.',
      'First external region proof.',
      'Measured onboarding effort.'
    ],
    guardrails: ['Не продавать “федеральный rollout” до реального межрегионального proof.']
  },
  {
    id: 'api-sdk',
    maturity: 'scale',
    payer: 'provider',
    chargeBasis: 'Enterprise API/SDK access, support and certification.',
    valueCreated: 'Embedding verified destination and journey capabilities in external channels.',
    evidenceRequiredBeforePricing: [
      'Stable API contract.',
      'External integration proof.',
      'Support/SLA model.'
    ],
    guardrails: ['API не расширяет права на underlying third-party content автоматически.']
  }
];

export const valueFlywheel = [
  'Больше verified city content → полезнее traveler journey.',
  'Больше полезных journey → больше privacy-safe aggregate demand evidence.',
  'Больше demand evidence → выше ценность Partner Console и city intelligence.',
  'Больше authoritative partners → больше реального inventory и меньше dead ends.',
  'Больше provider coverage → выше utility продукта и вероятность повторного использования.',
  'Стандартизированные Studio / adapters / destination packages → ниже marginal effort следующего района.',
  'Ни один шаг flywheel не требует продажи персональных данных или подмены editorial truth платным ranking.'
] as const;
