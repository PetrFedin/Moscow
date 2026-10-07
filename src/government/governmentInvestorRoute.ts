import {
  getGovernmentPilotReadiness,
  governmentPilotOffer
} from './governmentPilotOffer.ts';
import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness
} from './pilotInvestmentDecision.ts';

export const GOVERNMENT_INVESTOR_ROUTE_VERSION = 2 as const;

export type GovernmentInvestorAudience = 'moscow-partner' | 'investor' | 'federal';

export type GovernmentInvestorRouteStep = {
  id:
    | 'problem'
    | 'pilot'
    | 'proof'
    | 'city-ask'
    | 'city-value'
    | 'funding'
    | 'scale'
    | 'next-decision';
  minute: string;
  title: string;
  question: string;
  body: string;
  evidence: string[];
  decision: string;
};

export type GovernmentInvestorStakeholder = {
  id: string;
  role: string;
  candidateContour: string;
  responsibility: string;
  caveat: string;
};

export type GovernmentPilotBrief = {
  problem: string;
  scope: string;
  cityContribution: string;
  deliverables: string;
  acceptance: string;
  blockers: string;
  nextDecision: string;
};

export type GovernmentInvestorRoute = {
  version: typeof GOVERNMENT_INVESTOR_ROUTE_VERSION;
  title: string;
  subtitle: string;
  durationMinutes: '7–10';
  firstMeetingGoal: string;
  firstMeetingDoNotAsk: string;
  pilotBrief: GovernmentPilotBrief;
  steps: GovernmentInvestorRouteStep[];
  stakeholderMap: GovernmentInvestorStakeholder[];
  cityNextAction: string;
  investorNextAction: string;
  federalNextAction: string;
};

export const governmentInvestorRoute: GovernmentInvestorRoute = {
  version: GOVERNMENT_INVESTOR_ROUTE_VERSION,
  title: 'Маршрут сотрудничества · Москва → масштаб',
  subtitle: '7–10 минут до одного конкретного решения',
  durationMinutes: '7–10',
  firstMeetingGoal:
    'Согласовать владельца задачи, площадку и формат доказательного пилота «Варварка во времени».',
  firstMeetingDoNotAsk:
    'Не просить финансирование всей платформы, Москвы и федерального масштаба одним решением.',
  pilotBrief: {
    problem:
      'Городские карты, контент, билеты и отдельные AR/3D-решения существуют, но нет единого доказательного стандарта цифрового исторического объекта и исполнимого туристического пути.',
    scope:
      'Варварка — Зарядье: 5 точек, 2 spatial hero objects, RU/EN/ZH, audio/offline/accessibility и supervised visitor pilot 20–50 участников.',
    cityContribution:
      'Профильный owner, площадка, доступ к объектам и экспертам, integration/data contact, согласованная методология и формальная приёмка.',
    deliverables:
      'Verified heritage packages при пройденных gates, Studio workflow, mobile journey, integration contracts, field/user evidence, handover и измеренная production economics.',
    acceptance:
      'Приёмка только по заранее определённым evidence gates: spatial proof, repeatability второго объекта, reviewed visitor pilot, rights/security/IP/operations и измеренная экономика.',
    blockers:
      'Сейчас не закрыты реальные field/user/provider gates и часть decision-readiness evidence; software demo не конвертирует их в PASS.',
    nextDecision:
      'Назначить владельца задачи, определить пилотную площадку и провести рабочую сессию по scope / data / acceptance / IP / operations.'
  },
  steps: [
    {
      id: 'problem',
      minute: '0:00–1:00',
      title: 'Проблема, которую мы предлагаем решить',
      question: 'Зачем городу ещё один цифровой продукт?',
      body:
        'Не ещё один каталог и не отдельная AR-сцена. Предлагаем общий доказательный стандарт: источник → права → реконструкция → model version → field proof → публикация → маршрут → live data → аналитика.',
      evidence: [
        'Heritage truth и spatial truth отделены от UI.',
        'Один verified object задуман для повторного использования в нескольких городских каналах.',
        'Интеграция предпочтительнее дублирования RUSSPASS и других существующих сервисов.'
      ],
      decision: 'Обсуждать платформу как городскую инфраструктуру и стандарт, а не как экскурсионное приложение.'
    },
    {
      id: 'pilot',
      minute: '1:00–2:00',
      title: 'Что предлагаем профинансировать первым',
      question: 'Как ограничить риск первого решения?',
      body:
        'Один bounded pilot: «Варварка во времени». Пять точек, два spatial hero objects, 20–50 supervised участников и заранее определённая evidence-based приёмка.',
      evidence: [
        'Палаты Романовых — точность и cross-device field proof.',
        'Старый Английский двор — повторяемость production pipeline.',
        'Visitor pilot — понимание маршрута и реальное использование.'
      ],
      decision: 'Первое решение — запустить доказательный пилот, а не масштабировать весь продукт.'
    },
    {
      id: 'proof',
      minute: '2:00–4:00',
      title: 'Что уже построено, а что ещё надо доказать',
      question: 'Где заканчивается software demo и начинается реальное evidence?',
      body:
        'Приложение показывает реализованные authority и отдельно блокеры, которые нельзя закрыть вручную. Физическое поле, реальные пользователи и provider access остаются внешними gates.',
      evidence: [
        'PublishedSpatialPackage + City Heritage Studio + rights/review authority.',
        'Web / iOS / Android builds и browser E2E.',
        'Privacy-safe pilot analytics и live-provider freshness/booking authority.'
      ],
      decision: 'Не принимать green status без реального evidence.'
    },
    {
      id: 'city-ask',
      minute: '4:00–5:00',
      title: 'Что нужно от Москвы',
      question: 'Что город должен дать кроме денег?',
      body:
        'Главный дефицит сейчас — не функции. Нужны площадка, профильный owner, доступ к объектам и экспертам, visitor-research support и формальный integration dialogue.',
      evidence: [
        'Romanov field access и физические устройства.',
        'Old English Court asset / survey authority.',
        'Контакт для RUSSPASS / tourism-data integration.',
        'Согласованная методология, график и приёмка пилота.'
      ],
      decision: 'Назначить владельца задачи и собрать рабочую группу пилота.'
    },
    {
      id: 'city-value',
      minute: '5:00–6:00',
      title: 'Что остаётся у города после пилота',
      question: 'Что получит Москва, даже если масштабирование не будет одобрено?',
      body:
        'Пилот должен оставить не только приложение, а проверяемые цифровые объекты, production workflow, Studio governance, evidence bundle и измеренную стоимость следующего объекта/района.',
      evidence: [
        'Versioned source / rights / claims registry.',
        'Field + user evidence.',
        'Integration contracts и data boundaries.',
        'Go / No-Go пакет с измеренной production economics.'
      ],
      decision: 'Принимать пилот по передаваемым артефактам и evidence, а не по эффектности demo.'
    },
    {
      id: 'funding',
      minute: '6:00–7:00',
      title: 'Как появляется финансирование',
      question: 'Где пилот, где закупка, а где инвестиции?',
      body:
        'Четыре контура разделены: городской пилот, последующее внедрение, инвестиционное финансирование и федеральные/региональные механизмы. Ни один не считается гарантированным заранее.',
      evidence: [
        'Первый вход — формализованный городской pilot track.',
        'После proof — отдельный договорный/закупочный/лицензионный контур.',
        'После measured economics — инвестиционное рассмотрение и частное софинансирование.',
        'После Moscow reference + first region — федеральный dialogue.'
      ],
      decision: 'Сначала доказать и измерить; затем выбирать применимый механизм денег.'
    },
    {
      id: 'scale',
      minute: '7:00–9:00',
      title: 'Почему это может стать федеральным продуктом',
      question: 'Что именно масштабируется за пределы Москвы?',
      body:
        'Не московское приложение как бренд, а общий DestinationPackage, heritage governance, spatial verification и journey/orchestration layer. Первый внешний регион обязан пройти тот же contract без московских исключений.',
      evidence: [
        'Москва / Варварка → район Москвы → city standard.',
        'Первый внешний регион → generic proof.',
        'Межрегиональный journey → федеральный integration dialogue.'
      ],
      decision: 'Федеральный narrative включается только после Moscow proof и первого внешнего региона.'
    },
    {
      id: 'next-decision',
      minute: '9:00–10:00',
      title: 'Одно решение после встречи',
      question: 'Что конкретно должно произойти дальше?',
      body:
        'Не просим “одобрить весь проект”. Просим согласовать короткий следующий процесс, который создаёт formal evidence для следующего решения.',
      evidence: [
        'Назначить профильного owner.',
        'Определить пилотную площадку и стороны.',
        'Провести рабочую сессию по scope / data / acceptance / IP / operations.',
        'Зафиксировать форму пилота и его бюджет только после подтверждения внешних inputs.'
      ],
      decision: 'Запустить подготовку ограниченного пилота «Варварка во времени».'
    }
  ],
  stakeholderMap: [
    {
      id: 'pilot-operator',
      role: 'Оператор пилота',
      candidateContour: 'Фонд «Московский инновационный кластер» / городской pilot track',
      responsibility: 'Формат апробации, площадка, методология, evidence и итог пилота.',
      caveat: 'Оператор пилота не считается автоматически конечным заказчиком или инвестором.'
    },
    {
      id: 'tourism-owner',
      role: 'Владелец туристического journey',
      candidateContour: 'Профильный туристический контур Москвы / RUSSPASS',
      responsibility: 'Пользовательский сценарий, городской distribution channel и требования к туристическому продукту.',
      caveat: 'Конкретный buyer/budget owner должен быть подтверждён на переговорах.'
    },
    {
      id: 'heritage-owner',
      role: 'Heritage / content authority',
      candidateContour: 'Профильное учреждение культуры / владелец объекта / исторические эксперты',
      responsibility: 'Источники, права, historical claims, доступ к объекту, survey и review.',
      caveat: 'Историческая authority не должна подменяться продуктовой командой.'
    },
    {
      id: 'integration-owner',
      role: 'Integration / data owner',
      candidateContour: 'Технический владелец tourism-data / booking / provider integration',
      responsibility: 'Schema, sandbox/feed, freshness, attribution, booking handoff и эксплуатационные границы.',
      caveat: 'Без формального доступа приложение не заявляет live Moscow data.'
    },
    {
      id: 'contract-owner',
      role: 'Договор / бюджет / эксплуатация',
      candidateContour: 'Определяется вместе с городом после выбора площадки и формы пилота',
      responsibility: 'Правовая форма этапа, бюджет, закупка/лицензия/интеграция, SLA и handover.',
      caveat: 'Не назначаем бюджетодержателя из проекта или презентации.'
    },
    {
      id: 'investment-route',
      role: 'Инвестиционный контур',
      candidateContour: 'Инвестиционная экспертиза / венчурные и частные соинвесторы',
      responsibility: 'Финансирование масштабирования после proof и measured economics.',
      caveat: 'Инвестиционный процесс идёт после evidence, отдельно от городской приёмки пилота.'
    }
  ],
  cityNextAction:
    'Согласовать профильного владельца, пилотную площадку и рабочую сессию по методологии/интеграции.',
  investorNextAction:
    'Вернуться к инвестиционному рассмотрению после physical proof, visitor proof и измеренной unit economics.',
  federalNextAction:
    'После Moscow reference city и первого внешнего региона подготовить interregional proof и отдельный федеральный механизм.'
};

export function getGovernmentInvestorRouteState() {
  const readiness = getGovernmentPilotReadiness(governmentPilotOffer);
  const investment = getPilotDecisionReadiness(currentPilotInvestmentEvidence);

  return {
    routeVersion: governmentInvestorRoute.version,
    implementedProofItems: readiness.implemented,
    totalProofItems: readiness.total,
    pilotProven: readiness.pilotProven,
    decisionPackReady: investment.decisionPackReady,
    proofReady: investment.proofReady,
    governanceReady: investment.governanceReady,
    economicsReady: investment.economicsReady,
    blockerCount: investment.blockers.length,
    firstMeetingGoal: governmentInvestorRoute.firstMeetingGoal,
    cityNextAction: governmentInvestorRoute.cityNextAction,
    pilotBrief: governmentInvestorRoute.pilotBrief
  };
}
