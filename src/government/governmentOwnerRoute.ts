import type { AppLanguage } from '../i18n';

export type GovernmentOwnerRouteDestination =
  | 'control'
  | 'product'
  | 'deliverables'
  | 'ecosystem'
  | 'operations'
  | 'money'
  | 'acceptance'
  | 'contract';

export type GovernmentOwnerRouteStep = {
  id: string;
  durationSeconds: number;
  destination: GovernmentOwnerRouteDestination;
  kicker: string;
  title: string;
  executiveQuestion: string;
  answer: string;
  cityValue: string;
  travelerValue: string;
  partnerValue: string;
  proof: string;
};

export type GovernmentOwnerRouteCopy = {
  kicker: string;
  title: string;
  subtitle: string;
  durationLabel: string;
  progressLabel: string;
  executiveQuestionLabel: string;
  answerLabel: string;
  cityValueLabel: string;
  travelerValueLabel: string;
  partnerValueLabel: string;
  proofLabel: string;
  openEvidenceLabel: string;
  previousLabel: string;
  nextLabel: string;
  finishLabel: string;
  finalDecisionTitle: string;
  finalDecisionBody: string;
  steps: GovernmentOwnerRouteStep[];
};

const durations = [45, 55, 50, 45, 50, 55, 60, 55, 60, 55, 60, 50] as const;

const ru: GovernmentOwnerRouteCopy = {
  kicker: 'CEO / GOVERNMENT OWNER ROUTE',
  title: 'За 10–12 минут: что покупает Москва, кому это даёт ценность и как результат контролируется',
  subtitle:
    'Не презентация функций, а один маршрут решения: турист → спрос → партнёр → район → сценарий → капитал → исполнение → обучение → аудит.',
  durationLabel: 'ПЛАНОВОЕ ВРЕМЯ',
  progressLabel: 'ШАГ',
  executiveQuestionLabel: 'ВОПРОС ЛПР',
  answerLabel: 'ОТВЕТ ПРОДУКТА',
  cityValueLabel: 'МОСКВА ПОЛУЧАЕТ',
  travelerValueLabel: 'ТУРИСТ ПОЛУЧАЕТ',
  partnerValueLabel: 'ПАРТНЁР ПОЛУЧАЕТ',
  proofLabel: 'ГДЕ ДОКАЗАТЕЛЬСТВО',
  openEvidenceLabel: 'Открыть доказательный слой',
  previousLabel: 'Назад',
  nextLabel: 'Следующий шаг',
  finishLabel: 'К решению',
  finalDecisionTitle: 'Решение после walkthrough',
  finalDecisionBody:
    'Согласовать owner пилота, ограниченный scope, acceptance matrix, data/integration owners и правовую форму. Масштабирование и инвестиционные эффекты не считаются доказанными до реального pilot evidence.',
  steps: [
    {
      id: 'city-problem',
      durationSeconds: durations[0],
      destination: 'control',
      kicker: '01 · CITY PROBLEM',
      title: 'Туристу нужен исполнимый день, а городу — наблюдаемая туристическая система',
      executiveQuestion: 'Какую городскую проблему мы реально решаем?',
      answer:
        'Разрыв между намерением туриста и фактическим исполнением дня: план, билет, бронь, маршрут, контекст, provider truth и подтверждённое посещение сегодня разнесены по разным слоям.',
      cityValue:
        'Единый операционный контур journey completion, provider failures, demand gaps и доказательств результата.',
      travelerValue:
        'Один понятный день в Москве вместо набора несвязанных ссылок, билетов, карт и заметок.',
      partnerValue:
        'Появляется измеримый handoff от намерения туриста к подтверждённой транзакции.',
      proof: 'Executive Control: pilot scope → deliverables → acceptance → city KPI → scale decision.'
    },
    {
      id: 'traveler-utility',
      durationSeconds: durations[1],
      destination: 'product',
      kicker: '02 · TRAVELER UTILITY',
      title: 'План поездки превращается в живой Today: что делать, куда идти и что уже подтверждено',
      executiveQuestion: 'Почему турист будет пользоваться этим каждый день поездки?',
      answer:
        'Продукт собирает фиксированные билеты и брони, свободные окна, маршрут и городской контекст; при изменениях перестраивает только гибкую часть дня и сохраняет историю фактических посещений.',
      cityValue:
        'Город получает не охват каталога, а измеримый путь от planning до visit evidence.',
      travelerValue:
        'Меньше организационного трения, меньше потерянного времени, персональная история «Моя Москва».',
      partnerValue:
        'Пользователь приходит к партнёру в релевантный момент с уже сформированным intent.',
      proof: 'Product flow: plan → Today → route → ticket/reservation → visit → My Moscow.'
    },
    {
      id: 'city-buys',
      durationSeconds: durations[2],
      destination: 'deliverables',
      kicker: '03 · WHAT THE CITY BUYS',
      title: 'Город покупает работающие активы и право их эксплуатировать, а не набор экранов',
      executiveQuestion: 'Что физически остаётся у Москвы после контракта?',
      answer:
        'Reference client, district package, Heritage Studio, Journey Control Center, integration contracts и pilot evidence pack с формальной приёмкой.',
      cityValue:
        'Передаваемый и расширяемый городской цифровой слой без зависимости от одной презентации или одного подрядчика.',
      travelerValue:
        'Стабильный сервис с проверяемым контентом и понятными границами provider truth.',
      partnerValue:
        'Стандартизированный интеграционный контур вместо разовых маркетинговых размещений.',
      proof: 'Deliverables + Pilot Contract Builder + handover/acceptance clauses.'
    },
    {
      id: 'partner-economics',
      durationSeconds: durations[3],
      destination: 'ecosystem',
      kicker: '04 · PARTNER ECONOMICS',
      title: 'Ценность распределена между туристом, городом и коммерческой экосистемой',
      executiveQuestion: 'Зачем в системе участвовать ресторанам, музеям, площадкам и провайдерам?',
      answer:
        'Партнёр получает квалифицированный спрос, управляемый inventory/availability, подтверждённый handoff, attribution и settlement evidence — без покупки скрытого органического ранга.',
      cityValue:
        'Больше полезного supply и прозрачная коммерческая экосистема вокруг городской туристической функции.',
      travelerValue:
        'Релевантное предложение в нужное время без превращения маршрута в рекламную ленту.',
      partnerValue:
        'Измеримый demand → confirmed transaction → revenue attribution → settlement.',
      proof: 'Stakeholder Value + Partner Operating Layer.'
    },
    {
      id: 'demand-marketplace',
      durationSeconds: durations[4],
      destination: 'operations',
      kicker: '05 · DEMAND MARKETPLACE',
      title: 'Marketplace ранжирует полезность отдельно от paid sponsorship',
      executiveQuestion: 'Как монетизировать спрос и не испортить городской продукт?',
      answer:
        'Organic ranking использует relevance, distance, time, availability, preference и service quality. Платное продвижение отделено от органической полезности и не меняет partner shortlist.',
      cityValue:
        'Коммерциализация без потери доверия к городскому сервису.',
      travelerValue:
        'Лучший вариант по контексту, а не тот, кто больше заплатил за место в маршруте.',
      partnerValue:
        'Понятные правила доступа к спросу, кампаний, handoff и attribution.',
      proof: 'Marketplace & Demand Engine: ranking policy → offer → booking/ticket → confirmation → attribution.'
    },
    {
      id: 'district-opportunity',
      durationSeconds: durations[5],
      destination: 'operations',
      kicker: '06 · DISTRICT OPPORTUNITY',
      title: 'Незакрытый туристический спрос становится конкретной возможностью района',
      executiveQuestion: 'Где городу и бизнесу реально не хватает качественного предложения?',
      answer:
        'Control Tower измеряет unmet intent, fresh supply coverage, provider confirmation и partner quality; устойчивый gap формирует acquisition brief, shortlist и post-onboarding measurement.',
      cityValue:
        'Сигнал, где развивать supply или качество существующей инфраструктуры.',
      travelerValue:
        'Меньше ситуаций «хочу — но сейчас нечего предложить или невозможно подтвердить».',
      partnerValue:
        'Acquisition основан на доказанном спросе конкретного района и времени.',
      proof: 'Demand Control Tower → City Opportunity Engine → gap closed / still open.'
    },
    {
      id: 'digital-twin',
      durationSeconds: durations[6],
      destination: 'operations',
      kicker: '07 · DIGITAL TWIN',
      title: 'Перед интервенцией город видит сценарий, но модель никогда не выдаётся за факт',
      executiveQuestion: 'Что будет, если добавить supply, продлить часы, изменить маршрут или provider layer?',
      answer:
        'District Economic Digital Twin показывает baseline → intervention → expected delta → post-launch verification. ACTUAL прогноз блокируется без measured calibration.',
      cityValue:
        'Сравнение вариантов до затрат капитала и обязательная проверка после запуска.',
      travelerValue:
        'Инфраструктура развивается там и так, где это должно снижать реальное трение путешествия.',
      partnerValue:
        'Более предсказуемая логика развития районов и интеграций.',
      proof: 'Digital Twin: +3 restaurants / +2 museum hours / evening route / ticket provider scenarios.'
    },
    {
      id: 'capital-portfolio',
      durationSeconds: durations[7],
      destination: 'operations',
      kicker: '08 · CAPITAL PORTFOLIO',
      title: 'Ограниченный бюджет сравнивается по эффекту, confidence, риску и capital efficiency',
      executiveQuestion: 'Если бюджет ограничен, какие интервенции заслуживают рассмотрения первыми?',
      answer:
        'District Portfolio Optimizer формирует recommendation-only shortlist под budget constraint и исключает low-confidence/high-risk варианты.',
      cityValue:
        'Сопоставимые capital alternatives и дисциплина «не превысить envelope».',
      travelerValue:
        'Капитал направляется в интервенции, которые должны улучшать доступность и исполнение туристического дня.',
      partnerValue:
        'Понятная связь между рыночным gap, intervention и ожидаемой экономикой.',
      proof: 'Portfolio Optimizer: budget → scores → selected/rejected → expected portfolio impact.'
    },
    {
      id: 'committee-governance',
      durationSeconds: durations[8],
      destination: 'operations',
      kicker: '09 · COMMITTEE GOVERNANCE',
      title: 'Рекомендация становится капиталом только через evidence, approvals и formal commitment',
      executiveQuestion: 'Кто и на каком основании разрешает потратить деньги?',
      answer:
        'Business case связывает sponsor/owner, budget source, подтверждённый procurement path, evidence package и последовательные approval stages. Без них capital commitment технически блокируется.',
      cityValue:
        'Контролируемый переход от аналитики к формальному исполнению.',
      travelerValue:
        'Изменения в городской инфраструктуре не строятся на одном красивом прогнозе.',
      partnerValue:
        'Прозрачные основания пилота, финансирования, исполнения и acceptance.',
      proof: 'Investment Committee Workspace → committed capital → execution milestones → benefits realization.'
    },
    {
      id: 'programme-control',
      durationSeconds: durations[9],
      destination: 'operations',
      kicker: '10 · PROGRAMME CONTROL',
      title: 'Мэрия видит весь портфель: committed, actual, effect, underperformance и reallocation candidates',
      executiveQuestion: 'Что происходит со всей программой после одобрения отдельных кейсов?',
      answer:
        'Capital Programme Control Tower отделяет committed от actual и uncommitted, выявляет underperformance и показывает reallocation opportunities без автоматического переброса средств.',
      cityValue:
        'Единый programme-level контроль капитала, исполнения и benefits realization.',
      travelerValue:
        'Слабые интервенции выявляются и пересматриваются вместо бесконечного продления.',
      partnerValue:
        'Понятно, какие программы масштабируются, корректируются или останавливаются.',
      proof: 'Programme Control → Strategy & Capital Rebalancing Board.'
    },
    {
      id: 'learning-model-risk',
      durationSeconds: durations[10],
      destination: 'operations',
      kicker: '11 · LEARNING & MODEL RISK',
      title: 'Система измеряет собственные ошибки и не имеет права тихо переписать production-модель',
      executiveQuestion: 'Почему следующему прогнозу можно доверять больше — или меньше?',
      answer:
        'Forecast history сравнивается с actual outcomes по archetype × district context. Ошибки меняют confidence; calibration проходит holdout, acceptance, versioning, challenger comparison и explicit activation.',
      cityValue:
        'Самокалибрующаяся аналитика с model-risk governance вместо непрозрачного «ИИ так решил».',
      travelerValue:
        'Решения о развитии сервиса со временем опираются на проверенную историю результатов.',
      partnerValue:
        'Меньше произвольных изменений правил и более предсказуемая модель спроса.',
      proof: 'Strategy Learning Loop → Model Risk Board → promotion / rollback gates.'
    },
    {
      id: 'audit-decision',
      durationSeconds: durations[11],
      destination: 'acceptance',
      kicker: '12 · AUDIT & NEXT DECISION',
      title: 'Через год любое решение можно воспроизвести от исходных данных до следующей версии модели',
      executiveQuestion: 'Как доказать, почему решение было принято и что из него получилось?',
      answer:
        'Urban Evidence & Decision Audit Ledger связывает data snapshot, model/policy version, scenario, approvals, capital, execution, outcome, learning и model change в append-only hash chain.',
      cityValue:
        'Институциональная память, ответственность и воспроизводимый decision provenance.',
      travelerValue:
        'Городской продукт развивается через проверяемые результаты, а не через память отдельных команд.',
      partnerValue:
        'Зафиксированные правила, approvals и evidence trail для коммерческого взаимодействия.',
      proof: 'Audit Ledger integrity → decision replay → completeness → next decision.'
    }
  ]
};

function translated(
  base: GovernmentOwnerRouteCopy,
  language: AppLanguage
): GovernmentOwnerRouteCopy {
  if (language === 'ru') return base;

  const enSteps: GovernmentOwnerRouteStep[] = [
    ['CITY PROBLEM','Travelers need an executable day; the city needs an observable tourism system','What city problem are we actually solving?','The gap between traveler intent and execution: plan, ticket, reservation, route, context, provider truth and confirmed visit live in separate layers today.','One operating layer for journey completion, provider failures, demand gaps and outcome evidence.','One understandable Moscow day instead of disconnected links, tickets, maps and notes.','A measurable handoff from traveler intent to a confirmed transaction.','Executive Control: pilot scope → deliverables → acceptance → city KPI → scale decision.','control'],
    ['TRAVELER UTILITY','The trip plan becomes a live Today: what to do, where to go and what is confirmed','Why would a traveler use this every day of the trip?','The product combines fixed tickets/reservations, free windows, routing and city context; when plans change it replans only the flexible layer and keeps visit history.','Measured progression from planning to visit evidence, not catalogue reach.','Less coordination friction, less wasted time and a personal My Moscow history.','The traveler reaches the partner at a relevant moment with explicit intent.','Product flow: plan → Today → route → ticket/reservation → visit → My Moscow.','product'],
    ['WHAT THE CITY BUYS','The city buys operating assets and the ability to run them — not a collection of screens','What physically remains with Moscow after the contract?','Reference client, district package, Heritage Studio, Journey Control Center, integration contracts and a formally accepted pilot evidence pack.','A transferable and extensible city digital layer.','A stable service with verified content and clear provider-truth boundaries.','A standardized integration path instead of one-off placements.','Deliverables + Pilot Contract Builder + handover/acceptance clauses.','deliverables'],
    ['PARTNER ECONOMICS','Value is distributed across traveler, city and commercial ecosystem','Why should restaurants, museums, venues and providers participate?','Partners receive qualified demand, controlled inventory/availability, confirmed handoff, attribution and settlement evidence without buying hidden organic rank.','More useful supply and a transparent commercial ecosystem around the public tourism function.','Relevant choices at the right moment without turning the route into an ad feed.','Measured demand → confirmed transaction → revenue attribution → settlement.','Stakeholder Value + Partner Operating Layer.','ecosystem'],
    ['DEMAND MARKETPLACE','Marketplace utility ranking is separated from paid sponsorship','How can demand be monetized without damaging the city product?','Organic ranking uses relevance, distance, time, availability, preferences and service quality. Paid promotion is separated from organic utility and does not alter partner shortlist rank.','Commercialization without losing trust in the city service.','The best contextual option, not simply the highest bidder.','Transparent access to demand, campaigns, handoff and attribution.','Marketplace & Demand Engine: ranking policy → offer → booking/ticket → confirmation → attribution.','operations'],
    ['DISTRICT OPPORTUNITY','Unmet tourist demand becomes a concrete district opportunity','Where is quality supply genuinely missing?','The Control Tower measures unmet intent, fresh supply coverage, provider confirmation and partner quality; persistent gaps create acquisition briefs, shortlists and post-onboarding measurement.','A signal for where to develop supply or improve existing infrastructure.','Fewer situations where intent exists but nothing usable can be confirmed.','Acquisition based on proven demand by district and time.','Demand Control Tower → City Opportunity Engine → gap closed / still open.','operations'],
    ['DIGITAL TWIN','Before intervention the city sees a scenario, but the model is never presented as fact','What happens if supply, opening hours, routing or provider infrastructure changes?','The District Economic Digital Twin shows baseline → intervention → expected delta → post-launch verification. ACTUAL forecasting is blocked without measured calibration.','Comparable options before capital is spent and mandatory verification afterwards.','Infrastructure develops where it should reduce real travel friction.','More predictable district and integration development logic.','Digital Twin: +3 restaurants / +2 museum hours / evening route / ticket provider scenarios.','operations'],
    ['CAPITAL PORTFOLIO','A constrained budget is compared by impact, confidence, risk and capital efficiency','With limited budget, which interventions deserve consideration first?','The District Portfolio Optimizer creates a recommendation-only shortlist under a budget constraint and excludes low-confidence/high-risk options.','Comparable capital alternatives and envelope discipline.','Capital is directed toward interventions expected to improve accessibility and trip execution.','A clear link between market gap, intervention and expected economics.','Portfolio Optimizer: budget → scores → selected/rejected → expected portfolio impact.','operations'],
    ['COMMITTEE GOVERNANCE','A recommendation becomes committed capital only through evidence, approvals and formal authority','Who is allowed to authorize spending and on what basis?','The business case links sponsor/owner, funding source, confirmed procurement route, evidence package and sequential approvals. Capital commitment is technically blocked until those gates close.','A controlled transition from analytics into formal delivery.','Infrastructure is not changed on the strength of one attractive forecast.','Transparent basis for pilot, funding, execution and acceptance.','Investment Committee Workspace → committed capital → execution milestones → benefits realization.','operations'],
    ['PROGRAMME CONTROL','The city sees the full portfolio: committed, actual, effect, underperformance and reallocation candidates','What happens to the programme after individual cases are approved?','The Capital Programme Control Tower separates committed, actual and uncommitted capital, detects underperformance and surfaces reallocation opportunities without moving funds automatically.','Programme-level control of capital, execution and benefits realization.','Weak interventions are reviewed instead of being extended indefinitely.','Clear visibility into which programmes scale, remediate or stop.','Programme Control → Strategy & Capital Rebalancing Board.','operations'],
    ['LEARNING & MODEL RISK','The system measures its own errors and cannot silently rewrite the production model','Why should the next forecast deserve more — or less — confidence?','Forecast history is compared with actual outcomes by archetype × district context. Errors adjust confidence; calibration requires holdout validation, acceptance, versioning, challenger comparison and explicit activation.','Self-calibrating analytics with model-risk governance instead of opaque “AI decided”.','Service development increasingly relies on verified historical outcomes.','Fewer arbitrary rule changes and a more predictable demand model.','Strategy Learning Loop → Model Risk Board → promotion / rollback gates.','operations'],
    ['AUDIT & NEXT DECISION','A year later every decision can be replayed from source data to the next model version','How do we prove why a decision was made and what happened afterwards?','The Urban Evidence & Decision Audit Ledger binds data snapshot, model/policy version, scenario, approvals, capital, execution, outcome, learning and model change in an append-only hash chain.','Institutional memory, accountability and reproducible decision provenance.','The city product evolves through verified outcomes rather than team memory.','Recorded rules, approvals and evidence trail for commercial interaction.','Audit Ledger integrity → decision replay → completeness → next decision.','acceptance']
  ].map((row, index) => ({
    id: base.steps[index]!.id,
    durationSeconds: durations[index]!,
    kicker: `${String(index + 1).padStart(2,'0')} · ${row[0]}`,
    title: row[1] as string,
    executiveQuestion: row[2] as string,
    answer: row[3] as string,
    cityValue: row[4] as string,
    travelerValue: row[5] as string,
    partnerValue: row[6] as string,
    proof: row[7] as string,
    destination: row[8] as GovernmentOwnerRouteDestination
  }));

  if (language === 'en') {
    return {
      ...base,
      kicker: 'CEO / GOVERNMENT OWNER ROUTE',
      title: 'In 10–12 minutes: what Moscow buys, who receives value and how outcomes are controlled',
      subtitle: 'Not a feature tour. One decision path: traveler → demand → partner → district → scenario → capital → delivery → learning → audit.',
      durationLabel: 'PLANNED TIME',
      progressLabel: 'STEP',
      executiveQuestionLabel: 'EXECUTIVE QUESTION',
      answerLabel: 'PRODUCT ANSWER',
      cityValueLabel: 'MOSCOW GETS',
      travelerValueLabel: 'TRAVELER GETS',
      partnerValueLabel: 'PARTNER GETS',
      proofLabel: 'EVIDENCE LAYER',
      openEvidenceLabel: 'Open evidence layer',
      previousLabel: 'Previous',
      nextLabel: 'Next step',
      finishLabel: 'Go to decision',
      finalDecisionTitle: 'Decision after the walkthrough',
      finalDecisionBody: 'Agree the pilot owner, bounded scope, acceptance matrix, data/integration owners and legal form. Scale and investment impact remain unproven until real pilot evidence exists.',
      steps: enSteps
    };
  }

  return {
    ...base,
    kicker: 'CEO / GOVERNMENT OWNER ROUTE',
    title: '10–12 分钟：莫斯科购买什么、谁获得价值以及如何控制结果',
    subtitle: '不是功能浏览，而是一条决策路径：游客 → 需求 → 合作伙伴 → 区域 → 场景 → 资本 → 执行 → 学习 → 审计。',
    durationLabel: '计划时长',
    progressLabel: '步骤',
    executiveQuestionLabel: '决策人问题',
    answerLabel: '产品回答',
    cityValueLabel: '莫斯科获得',
    travelerValueLabel: '游客获得',
    partnerValueLabel: '合作伙伴获得',
    proofLabel: '证据层',
    openEvidenceLabel: '打开证据层',
    previousLabel: '上一步',
    nextLabel: '下一步',
    finishLabel: '进入决策',
    finalDecisionTitle: 'Walkthrough 后的决策',
    finalDecisionBody: '确认试点 owner、有限 scope、acceptance matrix、数据/集成负责人和法律形式。在真实试点证据出现之前，不把规模化和投资效果视为已证明。',
    steps: base.steps.map((step, index) => ({
      ...step,
      kicker: `${String(index + 1).padStart(2,'0')} · ${[
        '城市问题','游客价值','城市购买内容','合作伙伴经济','需求市场','区域机会','数字孪生','资本组合','委员会治理','项目控制','学习与模型风险','审计与下一决策'
      ][index]}`,
      title: [
        '游客需要可执行的一天，城市需要可观察的旅游系统',
        '行程计划变成实时 Today：做什么、去哪里、什么已确认',
        '城市购买可运营资产和持续运营能力，而不是一组界面',
        '价值在游客、城市和商业生态之间分配',
        'Marketplace 将实用性排序与付费赞助分开',
        '未满足的游客需求变成具体区域机会',
        '干预前先看场景，但模型永远不冒充事实',
        '有限预算按效果、置信度、风险和资本效率比较',
        '建议只有经过证据、审批和正式授权才成为 committed capital',
        '市政府看到整个组合：承诺、实际、效果、低绩效和再配置候选',
        '系统衡量自己的错误，不能静默改写 production 模型',
        '一年后仍可从原始数据回放到下一模型版本'
      ][index]!,
      executiveQuestion: [
        '我们真正解决的城市问题是什么？',
        '为什么游客会在旅行的每一天使用它？',
        '合同结束后，莫斯科实际保留什么？',
        '餐厅、博物馆、场馆和服务商为什么参与？',
        '如何商业化需求而不损害城市产品？',
        '哪里真正缺少高质量供给？',
        '增加供给、延长开放时间、调整路线或 provider layer 会怎样？',
        '预算有限时，哪些干预应优先考虑？',
        '谁可以授权支出，依据是什么？',
        '单个 case 批准后，整个 programme 如何管理？',
        '为什么下一次预测应该更可信，或更不可信？',
        '如何证明当时为什么这样决定以及后来发生了什么？'
      ][index]!,
      answer: [
        '解决游客意图与实际执行之间的断层：计划、票、预订、路线、内容、provider truth 和确认到访目前分散在不同层。',
        '产品把固定票/预订、空闲窗口、路线和城市内容合并；变化时只重排灵活部分，并保留实际到访历史。',
        'Reference client、district package、Heritage Studio、Journey Control Center、integration contracts 和正式验收的 pilot evidence pack。',
        '合作伙伴获得合格需求、可控 inventory/availability、确认 handoff、attribution 和 settlement evidence，且不能购买隐藏 organic rank。',
        'Organic ranking 使用 relevance、distance、time、availability、preference 和 service quality；付费推广与 organic utility 分离。',
        'Control Tower 衡量 unmet intent、fresh supply coverage、provider confirmation 和 partner quality，并把持续 gap 转成 acquisition brief 与 post-onboarding measurement。',
        'Digital Twin 展示 baseline → intervention → expected delta → post-launch verification；没有 measured calibration 时 ACTUAL 预测被阻止。',
        'Portfolio Optimizer 在 budget constraint 下生成 recommendation-only shortlist，并排除 low-confidence/high-risk 方案。',
        'Business case 连接 sponsor/owner、资金来源、确认的 procurement path、evidence package 和顺序审批；未关闭前不能 commit capital。',
        'Programme Control 区分 committed、actual 和 uncommitted capital，识别 underperformance 并提出 reallocation opportunity，但不自动转移资金。',
        'Forecast history 与 actual outcome 按 archetype × district context 比较；误差改变 confidence，calibration 必须经过 holdout、acceptance、versioning、challenger 和 explicit activation。',
        'Audit Ledger 把 data snapshot、model/policy version、scenario、approval、capital、execution、outcome、learning 和 model change 绑定在 append-only hash chain。'
      ][index]!,
      cityValue: [
        '统一管理 journey completion、provider failure、demand gap 和结果证据。',
        '从 planning 到 visit evidence 的可测量城市路径。',
        '可交接、可扩展、不依赖单一演示或单一供应商的数字城市层。',
        '围绕城市旅游功能形成更多有效供给和透明商业生态。',
        '在不损失城市服务信任的前提下商业化。',
        '知道哪里需要发展供给或改善现有基础设施。',
        '支出资本前可比较方案，启动后必须验证。',
        '可比较的资本方案和 envelope 纪律。',
        '从分析到正式执行的受控转换。',
        'Programme-level 的资本、执行和 benefits realization 控制。',
        '具备 model-risk governance 的自校准分析。',
        '制度记忆、责任链和可重现 decision provenance。'
      ][index]!,
      travelerValue: [
        '一个清晰的莫斯科日程，而不是散落的链接、票、地图和笔记。',
        '更少协调摩擦、更少浪费时间，并形成“我的莫斯科”。',
        '稳定服务、已核验内容和清晰 provider truth 边界。',
        '在正确时间看到相关选择，而不是广告流。',
        '得到上下文最合适的选项，而不是出价最高者。',
        '减少“想去但没有可用/可确认选择”的情况。',
        '基础设施在应当减少真实旅行摩擦的地方发展。',
        '资本指向预计改善可达性和行程执行的干预。',
        '城市基础设施不会因为一个好看的预测就改变。',
        '弱干预会被 review，而不是无限续期。',
        '服务发展越来越基于已验证的历史结果。',
        '城市产品通过可验证结果演进，而不是依赖团队记忆。'
      ][index]!,
      partnerValue: [
        '从游客意图到确认交易的可测量 handoff。',
        '游客在相关时刻带着明确 intent 到达合作伙伴。',
        '标准化集成路径，而不是一次性营销投放。',
        '可测量 demand → confirmed transaction → attribution → settlement。',
        '透明的 demand、campaign、handoff 和 attribution 规则。',
        '按区域和时间的已证明需求进行 acquisition。',
        '更可预测的区域和 integration 发展逻辑。',
        '清楚连接 market gap、intervention 和预期经济性。',
        '透明的试点、融资、执行和 acceptance 依据。',
        '清楚哪些 programme 扩大、整改或停止。',
        '更少任意规则变化，更可预测的需求模型。',
        '商业互动有记录的规则、审批和 evidence trail。'
      ][index]!,
      proof: [
        'Executive Control：pilot scope → deliverables → acceptance → city KPI → scale decision。',
        'Product flow：plan → Today → route → ticket/reservation → visit → My Moscow。',
        'Deliverables + Pilot Contract Builder + handover/acceptance clauses。',
        'Stakeholder Value + Partner Operating Layer。',
        'Marketplace & Demand Engine：ranking policy → offer → booking/ticket → confirmation → attribution。',
        'Demand Control Tower → City Opportunity Engine → gap closed / still open。',
        'Digital Twin：+3 restaurants / +2 museum hours / evening route / ticket provider。',
        'Portfolio Optimizer：budget → scores → selected/rejected → expected impact。',
        'Investment Committee Workspace → committed capital → execution → benefits realization。',
        'Programme Control → Strategy & Capital Rebalancing Board。',
        'Strategy Learning Loop → Model Risk Board → promotion / rollback gates。',
        'Audit Ledger integrity → decision replay → completeness → next decision。'
      ][index]!
    }))
  };
}

export function getGovernmentOwnerRouteCopy(language: AppLanguage) {
  return translated(ru, language);
}

export function governmentOwnerRouteDurationSeconds() {
  return durations.reduce((sum, value) => sum + value, 0);
}
