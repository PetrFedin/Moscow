import type { AppLanguage } from '../i18n';
import type { RevenueEngineId, StakeholderId } from './stakeholderValueModel';

type StakeholderCopy = {
  title: string;
  promise: string;
  now: string[];
  later: string[];
  exchange: string;
};

type RevenueCopy = {
  title: string;
  payer: string;
  basis: string;
  unlock: string;
};

const stakeholderCopy: Record<StakeholderId, Record<AppLanguage, StakeholderCopy>> = {
  traveler: {
    ru: {
      title: 'Турист / пользователь',
      promise: 'Один личный слой Москвы: план → билет/бронь → маршрут → история → посещение → память о поездке.',
      now: [
        'Собрать поездку по дням и не потерять фиксированные билеты при перепланировании.',
        'Получать verified heritage вместо смешения факта и реконструкции.',
        'Хранить Moscow Passport: где был, что видел, где ел, что сохранить на следующий день.'
      ],
      later: [
        'Provider-confirmed wallet билетов и броней.',
        'Маршрут по интересам + доступности + погоде + live inventory.',
        'Персональные привилегии только с явным согласием.'
      ],
      exchange: 'Пользователь получает utility и доверие; платформа получает только privacy-safe journey evidence и добровольно предоставленные сигналы.'
    },
    en: {
      title: 'Traveler / user',
      promise: 'One personal Moscow layer: plan → ticket/reservation → route → history → visit → trip memory.',
      now: [
        'Build a day-by-day trip without breaking fixed tickets when flexible time is replanned.',
        'Receive verified heritage instead of mixing fact and reconstruction.',
        'Keep a Moscow Passport: where you went, what you saw, where you ate and what to continue.'
      ],
      later: [
        'Provider-confirmed ticket and reservation wallet.',
        'Routing by interests + accessibility + weather + live inventory.',
        'Personal benefits only with explicit consent.'
      ],
      exchange: 'The traveler receives utility and trust; the platform receives only privacy-safe journey evidence and voluntarily provided signals.'
    },
    zh: {
      title: '游客 / 用户',
      promise: '一个个人莫斯科层：计划 → 门票/预订 → 路线 → 历史 → 到访 → 旅行记忆。',
      now: [
        '按天规划旅程，重排行程时不破坏固定门票。',
        '获得经核验的文化遗产内容，而不是把事实与重建混在一起。',
        '保存 Moscow Passport：去过哪里、看过什么、在哪里用餐以及下一步继续什么。'
      ],
      later: [
        '服务商确认的门票与预订钱包。',
        '基于兴趣 + 无障碍 + 天气 + 实时库存的路线。',
        '只有在明确同意后才提供个性化权益。'
      ],
      exchange: '游客获得实用性与信任；平台仅获得隐私安全的旅程证据和用户自愿提供的信号。'
    }
  },
  city: {
    ru: {
      title: 'Москва / городской заказчик',
      promise: 'Не ещё один каталог, а управляемая цифровая инфраструктура туристического пути.',
      now: [
        'Bounded pilot с evidence-driven приёмкой.',
        'City Heritage Studio + Control Center.',
        'Фактическая cost basis следующего объекта и района.'
      ],
      later: [
        'Стандарт destination packages для районов.',
        'Aggregate destination intelligence для управления развитием.',
        'Повторное использование verified assets в разных городских каналах.'
      ],
      exchange: 'Город даёт governance, доступ и integration route; получает повторяемую инфраструктуру и измеримый результат.'
    },
    en: {
      title: 'Moscow / city buyer',
      promise: 'Not another catalogue, but governed digital infrastructure for the visitor journey.',
      now: [
        'Bounded pilot with evidence-driven acceptance.',
        'City Heritage Studio + Control Center.',
        'Measured cost basis for the next object and district.'
      ],
      later: [
        'Destination-package standard across districts.',
        'Aggregate destination intelligence for management decisions.',
        'Reuse of verified assets across city channels.'
      ],
      exchange: 'The city provides governance, access and integration routes; it receives repeatable infrastructure and measurable outcomes.'
    },
    zh: {
      title: '莫斯科 / 城市采购方',
      promise: '不是另一个目录，而是可治理的游客旅程数字基础设施。',
      now: [
        '有明确边界、以证据驱动验收的试点。',
        'City Heritage Studio + Control Center。',
        '下一个对象和区域的实测成本基础。'
      ],
      later: [
        '跨区域 destination package 标准。',
        '用于城市管理决策的聚合 destination intelligence。',
        '在多个城市渠道重复使用 verified assets。'
      ],
      exchange: '城市提供治理、访问和集成路径；获得可复制基础设施和可衡量结果。'
    }
  },
  heritage: {
    ru: {
      title: 'Музей / heritage institution',
      promise: 'Цифровой объект становится управляемым активом с источниками, правами, версиями и review trail.',
      now: [
        'Source / rights / claim / review / publish в одном workflow.',
        'Факт отделён от реконструкции и гипотезы.',
        'Материал можно повторно использовать в mobile / museum / education.'
      ],
      later: [
        'Institution workspace без bespoke-разработки.',
        'Собственные маршруты, коллекции и событийные слои.',
        'Aggregate engagement без передачи персональных данных.'
      ],
      exchange: 'Учреждение даёт экспертизу и rights authority; получает управляемое цифровое наследие и новый канал аудитории.'
    },
    en: {
      title: 'Museum / heritage institution',
      promise: 'A digital object becomes a governed asset with sources, rights, versions and review trail.',
      now: [
        'Source / rights / claim / review / publish in one workflow.',
        'Fact is separated from reconstruction and hypothesis.',
        'Content can be reused across mobile / museum / education.'
      ],
      later: [
        'Institution workspace without bespoke development.',
        'Own routes, collections and event layers.',
        'Aggregate engagement without personal-data transfer.'
      ],
      exchange: 'The institution contributes expertise and rights authority; it receives governed digital heritage and a new audience channel.'
    },
    zh: {
      title: '博物馆 / 文化遗产机构',
      promise: '数字对象成为具有来源、权利、版本和审核轨迹的可治理资产。',
      now: [
        '在一个流程中完成 source / rights / claim / review / publish。',
        '事实与重建、假设明确分离。',
        '内容可复用于移动端 / 博物馆 / 教育场景。'
      ],
      later: [
        '无需定制开发的机构工作空间。',
        '自有路线、收藏和活动层。',
        '无需传输个人数据的聚合互动指标。'
      ],
      exchange: '机构提供专业知识和权利授权；获得可治理数字文化遗产和新的受众渠道。'
    }
  },
  'commercial-partner': {
    ru: {
      title: 'Ресторан / театр / отель / событие',
      promise: 'Не рекламный баннер, а релевантное действие внутри уже сформированного маршрута пользователя.',
      now: [
        'Authoritative handoff к билету, столу, событию или размещению.',
        'Приложение не выдаёт переход за подтверждённую продажу.'
      ],
      later: [
        'Partner Console: profile, offers, availability, deep links, campaigns, attribution.',
        'Aggregate demand по районам, категориям и временным окнам.',
        'Совместные bundles “маршрут + культура + еда + событие”.'
      ],
      exchange: 'Партнёр даёт актуальный inventory и сервисную ответственность; получает qualified demand и измеримый handoff.'
    },
    en: {
      title: 'Restaurant / theatre / hotel / event',
      promise: 'Not an ad banner, but a relevant action inside an already formed traveler journey.',
      now: [
        'Authoritative handoff to a ticket, table, event or stay.',
        'The app never treats a handoff as a confirmed sale.'
      ],
      later: [
        'Partner Console: profile, offers, availability, deep links, campaigns, attribution.',
        'Aggregate demand by district, category and time window.',
        'Joint bundles: route + culture + food + event.'
      ],
      exchange: 'The partner provides current inventory and service accountability; receives qualified demand and measurable handoff.'
    },
    zh: {
      title: '餐厅 / 剧院 / 酒店 / 活动',
      promise: '不是广告横幅，而是在用户已形成的旅程中出现的相关行动。',
      now: [
        '权威跳转到门票、餐桌、活动或住宿。',
        '应用不会把跳转冒充为已确认销售。'
      ],
      later: [
        'Partner Console：资料、优惠、库存、deep links、活动和归因。',
        '按区域、类别和时间窗口的聚合需求。',
        '“路线 + 文化 + 餐饮 + 活动”联合套餐。'
      ],
      exchange: '合作伙伴提供实时库存并承担服务责任；获得高意向需求和可衡量跳转。'
    }
  },
  'integration-partner': {
    ru: {
      title: 'Ticketing / booking / data provider',
      promise: 'Новый distribution channel без потери provider truth и transaction authority.',
      now: [
        'Ясный API/deep-link contract.',
        'Fail-closed status: без provider receipt нет “подтверждено”.'
      ],
      later: [
        'Reusable certified adapters.',
        'Qualified demand из city journey.',
        'Совместимые destination packages вместо разовых интеграций.'
      ],
      exchange: 'Provider даёт authoritative state; получает дополнительный канал спроса и повторно используемую интеграцию.'
    },
    en: {
      title: 'Ticketing / booking / data provider',
      promise: 'A new distribution channel without losing provider truth or transaction authority.',
      now: [
        'Clear API/deep-link contract.',
        'Fail-closed state: without a provider receipt there is no “confirmed”.'
      ],
      later: [
        'Reusable certified adapters.',
        'Qualified demand from the city journey.',
        'Compatible destination packages instead of one-off integrations.'
      ],
      exchange: 'The provider supplies authoritative state; receives an additional demand channel and reusable integration.'
    },
    zh: {
      title: '票务 / 预订 / 数据服务商',
      promise: '在不丢失服务商事实权威和交易权威的前提下增加新的分发渠道。',
      now: [
        '清晰的 API/deep-link 契约。',
        'Fail-closed：没有 provider receipt 就不能显示“已确认”。'
      ],
      later: [
        '可重复使用的认证 adapters。',
        '来自城市旅程的高意向需求。',
        '兼容 destination packages，而非一次性集成。'
      ],
      exchange: '服务商提供权威状态；获得额外需求渠道和可复用集成。'
    }
  },
  'financial-investor': {
    ru: {
      title: 'Частный / стратегический инвестор',
      promise: 'Инвестирует не в набор экранов, а в переход от доказанного B2G pilot к повторяемой платформенной и B2B выручке.',
      now: [
        'Evidence-gated roadmap вместо выдуманного TAM.',
        'Понятно, какой revenue engine после какого proof можно разблокировать.',
        'Отдельно видны one-off production и потенциальная recurring platform revenue.'
      ],
      later: [
        'Рост recurring mix: platform / partner tools / API / regional license.',
        'Снижение marginal effort района за счёт Studio, adapters и standards.',
        'Network effect: verified city graph + partner coverage + aggregate demand evidence.'
      ],
      exchange: 'Инвестор даёт капитал и strategic distribution после доказанного gate; получает equity upside от роста повторяемой выручки, а не гарантированный доход.'
    },
    en: {
      title: 'Private / strategic investor',
      promise: 'Invests not in a collection of screens, but in the transition from proven B2G pilot to repeatable platform and B2B revenue.',
      now: [
        'Evidence-gated roadmap instead of invented TAM.',
        'Each revenue engine has an explicit proof gate before it can be treated as real.',
        'One-off production is separated from potential recurring platform revenue.'
      ],
      later: [
        'Higher recurring mix: platform / partner tools / API / regional licence.',
        'Lower marginal district effort through Studio, adapters and standards.',
        'Network effect: verified city graph + partner coverage + aggregate demand evidence.'
      ],
      exchange: 'The investor supplies capital and strategic distribution after proven gates; receives equity upside from repeatable revenue growth, not guaranteed returns.'
    },
    zh: {
      title: '私人 / 战略投资者',
      promise: '投资的不是一组界面，而是从已验证 B2G 试点走向可复制平台和 B2B 收入的能力。',
      now: [
        '以证据关卡为基础的路线图，而不是虚构 TAM。',
        '每个收入引擎在何种 proof 后才能解锁都清晰可见。',
        '一次性制作收入与潜在 recurring platform revenue 分开。'
      ],
      later: [
        '提高 recurring mix：平台 / 合作伙伴工具 / API / 区域许可。',
        '通过 Studio、adapters 和标准降低新增区域的边际投入。',
        '网络效应：verified city graph + partner coverage + aggregate demand evidence。'
      ],
      exchange: '投资者在通过证据关卡后提供资本和战略分发；获得可复制收入增长带来的股权上行，而不是保证收益。'
    }
  }
};

const revenueCopy: Record<RevenueEngineId, Record<AppLanguage, RevenueCopy>> = {
  'government-pilot': {
    ru: { title: 'Городской доказательный пилот', payer: 'Москва / городской заказчик', basis: 'Fixed bounded scope + acceptance', unlock: 'Доступно как первая коммерческая стадия после согласования договора.' },
    en: { title: 'Government evidence pilot', payer: 'Moscow / city buyer', basis: 'Fixed bounded scope + acceptance', unlock: 'First commercial stage once a real contract is agreed.' },
    zh: { title: '城市证据型试点', payer: '莫斯科 / 城市采购方', basis: '固定有限范围 + 验收', unlock: '在真实合同确认后可作为第一商业阶段。' }
  },
  'platform-license': {
    ru: { title: 'Платформа + эксплуатация', payer: 'Город / оператор', basis: 'Annual license / operations / support', unlock: 'После успешного пилота и согласованного production SLA.' },
    en: { title: 'Platform + operations', payer: 'City / operator', basis: 'Annual licence / operations / support', unlock: 'After a successful pilot and agreed production SLA.' },
    zh: { title: '平台 + 运营', payer: '城市 / 运营方', basis: '年度许可 / 运营 / 支持', unlock: '成功试点并确认 production SLA 后。' }
  },
  'district-production': {
    ru: { title: 'Производство нового района', payer: 'Город / учреждение', basis: 'Setup + integration + N × measured object cost', unlock: 'После измерения экономики второго независимого объекта.' },
    en: { title: 'New district production', payer: 'City / institution', basis: 'Setup + integration + N × measured object cost', unlock: 'After economics are measured on the second independent object.' },
    zh: { title: '新区域制作', payer: '城市 / 机构', basis: '初始化 + 集成 + N × 实测对象成本', unlock: '第二个独立对象完成经济性测量后。' }
  },
  'partner-console': {
    ru: { title: 'Partner Console', payer: 'Коммерческий партнёр', basis: 'B2B subscription / tooling tier', unlock: 'После proof партнёрского workflow и retention value.' },
    en: { title: 'Partner Console', payer: 'Commercial partner', basis: 'B2B subscription / tooling tier', unlock: 'After partner-workflow and retention value are proven.' },
    zh: { title: 'Partner Console', payer: '商业合作伙伴', basis: 'B2B 订阅 / 工具等级', unlock: '合作伙伴流程和留存价值得到验证后。' }
  },
  'provider-attribution': {
    ru: { title: 'Transaction attribution', payer: 'Ticketing / booking provider', basis: 'CPA / CPS / revenue share по договору', unlock: 'Только после provider-confirmed attribution и reconciliation.' },
    en: { title: 'Transaction attribution', payer: 'Ticketing / booking provider', basis: 'Contracted CPA / CPS / revenue share', unlock: 'Only after provider-confirmed attribution and reconciliation.' },
    zh: { title: '交易归因', payer: '票务 / 预订服务商', basis: '合同约定 CPA / CPS / revenue share', unlock: '仅在服务商确认归因并可对账后。' }
  },
  'sponsored-experience': {
    ru: { title: 'Маркированные sponsorship packages', payer: 'Бренд / партнёр', basis: 'Season / route / activation package', unlock: 'После правил brand safety и measurement contract.' },
    en: { title: 'Labelled sponsorship packages', payer: 'Brand / partner', basis: 'Season / route / activation package', unlock: 'After brand-safety rules and a measurement contract.' },
    zh: { title: '明确标识的赞助方案', payer: '品牌 / 合作伙伴', basis: '季节 / 路线 / activation package', unlock: '建立品牌安全规则和测量契约后。' }
  },
  'destination-intelligence': {
    ru: { title: 'Destination Intelligence', payer: 'Город / учреждение / оператор', basis: 'Subscription / reporting', unlock: 'После privacy/legal review и доказанного buyer workflow.' },
    en: { title: 'Destination Intelligence', payer: 'City / institution / operator', basis: 'Subscription / reporting', unlock: 'After privacy/legal review and proven buyer workflow.' },
    zh: { title: 'Destination Intelligence', payer: '城市 / 机构 / 运营方', basis: '订阅 / 报告', unlock: '隐私/法律审核及采购方流程得到验证后。' }
  },
  'regional-license': {
    ru: { title: 'Региональная лицензия', payer: 'Регион / destination operator', basis: 'Onboarding + license + production + support', unlock: 'После Moscow reference и первого внешнего региона.' },
    en: { title: 'Regional licence', payer: 'Region / destination operator', basis: 'Onboarding + licence + production + support', unlock: 'After the Moscow reference and first external region proof.' },
    zh: { title: '区域许可', payer: '地区 / destination operator', basis: '接入 + 许可 + 制作 + 支持', unlock: '莫斯科 reference 和首个外部地区验证后。' }
  },
  'api-sdk': {
    ru: { title: 'API / SDK', payer: 'Enterprise provider / platform', basis: 'Access + support + certification', unlock: 'После stable API и внешнего integration proof.' },
    en: { title: 'API / SDK', payer: 'Enterprise provider / platform', basis: 'Access + support + certification', unlock: 'After a stable API and external integration proof.' },
    zh: { title: 'API / SDK', payer: '企业服务商 / 平台', basis: '访问 + 支持 + 认证', unlock: '稳定 API 和外部集成验证后。' }
  }
};

export const ecosystemUi = {
  ru: {
    kicker: 'VALUE EXCHANGE · BUSINESS MODEL',
    title: 'Кто что получает и откуда появляется экономика платформы',
    body: 'Мы отделяем пользовательскую ценность, общественную ценность и коммерческую монетизацию. Будущие модели не показываются как существующая выручка.',
    now: 'ПОЛУЧАЕТ СЕЙЧАС / В MVP',
    later: 'ПОЛУЧИТ ПРИ МАСШТАБЕ',
    exchange: 'ОБМЕН ЦЕННОСТЬЮ',
    revenueTitle: 'Revenue engines',
    revenueBody: 'Каждый источник выручки имеет плательщика, базу тарификации и proof-gate до коммерческого запуска.',
    payer: 'ПЛАТЕЛЬЩИК',
    basis: 'БАЗА ТАРИФИКАЦИИ',
    unlock: 'КОГДА РАЗБЛОКИРУЕТСЯ',
    mvp: 'MVP',
    postPilot: 'ПОСЛЕ ПИЛОТА',
    scale: 'МАСШТАБ',
    investorTitle: 'На чём растёт стоимость для инвестора',
    investorPoints: [
      'Recurring revenue появляется только после доказанного pilot → platform conversion.',
      'Стандартизация должна снижать marginal effort каждого следующего района.',
      'B2B partner tools и API добавляют revenue layers без замены core platform.',
      'Network effect основан на verified city graph + provider coverage + aggregate demand, а не на продаже персональных данных.',
      'Любая оценка IRR, valuation или payback требует реальных контрактов и коммерческих метрик.'
    ]
  },
  en: {
    kicker: 'VALUE EXCHANGE · BUSINESS MODEL',
    title: 'Who receives what and where platform economics can emerge',
    body: 'User value, public value and commercial monetisation are separated. Future models are never presented as existing revenue.',
    now: 'VALUE NOW / MVP',
    later: 'VALUE AT SCALE',
    exchange: 'VALUE EXCHANGE',
    revenueTitle: 'Revenue engines',
    revenueBody: 'Every revenue source has a payer, charging basis and proof gate before commercial activation.',
    payer: 'PAYER',
    basis: 'CHARGE BASIS',
    unlock: 'UNLOCK CONDITION',
    mvp: 'MVP',
    postPilot: 'POST-PILOT',
    scale: 'SCALE',
    investorTitle: 'What can increase investor value',
    investorPoints: [
      'Recurring revenue appears only after proven pilot → platform conversion.',
      'Standardisation must reduce marginal effort for each next district.',
      'B2B partner tools and APIs add revenue layers without replacing the core platform.',
      'Network effect is based on verified city graph + provider coverage + aggregate demand, not personal-data sale.',
      'Any IRR, valuation or payback claim requires real contracts and commercial metrics.'
    ]
  },
  zh: {
    kicker: 'VALUE EXCHANGE · BUSINESS MODEL',
    title: '各方获得什么，以及平台经济从哪里产生',
    body: '用户价值、公共价值和商业变现明确分离。未来模型不会被展示成已经存在的收入。',
    now: '当前 / MVP 价值',
    later: '规模化价值',
    exchange: '价值交换',
    revenueTitle: '收入引擎',
    revenueBody: '每个收入来源在商业启动前都有明确付款方、计费基础和 proof gate。',
    payer: '付款方',
    basis: '计费基础',
    unlock: '解锁条件',
    mvp: 'MVP',
    postPilot: '试点后',
    scale: '规模化',
    investorTitle: '什么推动投资者价值增长',
    investorPoints: [
      'Recurring revenue 只有在 pilot → platform 转化被证明后才成立。',
      '标准化必须降低每个新增区域的边际投入。',
      'B2B 合作伙伴工具和 API 在不替换核心平台的情况下增加收入层。',
      '网络效应来自 verified city graph + provider coverage + aggregate demand，而不是出售个人数据。',
      '任何 IRR、估值或回收期主张都需要真实合同和商业指标。'
    ]
  }
} as const;

export function getStakeholderCopy(language: AppLanguage, id: StakeholderId) {
  return stakeholderCopy[id][language];
}

export function getRevenueCopy(language: AppLanguage, id: RevenueEngineId) {
  return revenueCopy[id][language];
}
