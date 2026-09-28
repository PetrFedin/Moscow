export const GOVERNMENT_PILOT_CHARTER_VERSION = 1 as const;

export type GovernmentPilotCharterRoleId =
  | 'project-team'
  | 'city-owner'
  | 'pilot-operator'
  | 'heritage-authority'
  | 'integration-owner'
  | 'visitor-research';

export type GovernmentPilotCharterRole = {
  id: GovernmentPilotCharterRoleId;
  title: string;
  responsibility: string[];
  mustNotBeAssumed: string;
};

export type GovernmentPilotCharterPhaseId =
  | 'scope'
  | 'pre-pilot'
  | 'evidence'
  | 'review'
  | 'next-stage';

export type GovernmentPilotCharterPhase = {
  id: GovernmentPilotCharterPhaseId;
  title: string;
  purpose: string;
  requiredInputs: string[];
  outputs: string[];
  gate: string;
};

export const governmentPilotCollaborationCharter = {
  version: GOVERNMENT_PILOT_CHARTER_VERSION,
  title: 'Pilot Collaboration Charter',
  subtitle: 'Кто что делает после первой встречи',
  status: 'proposed-working-model' as const,
  legalBoundary:
    'Это рабочая модель сотрудничества и распределения ответственности. Она не заменяет соглашение о пилоте, договор, закупочную документацию или внутренние решения города.',
  projectProvides: [
    'Работающий CITY PILOT / consumer experience и исходный software authority.',
    'PublishedSpatialPackage / City Heritage Studio / field-evidence contracts.',
    'Методологию Romanov field proof и second-object repeatability.',
    'Visitor research protocol, privacy-safe analytics и final-report framework.',
    'Live Destination provider/freshness/booking integration contract.',
    'Buyer-facing architecture, security/data-flow, IP/handover и operations drafts.',
    'Government Delivery Manifest, Funding Path и evidence-linked decision model.'
  ],
  cityOrPartnersProvide: [
    'Профильного владельца городской задачи с правом собрать нужные стороны.',
    'Пилотную площадку и разрешённый доступ к физическим объектам.',
    'Heritage/content authority: источники, экспертов, права/согласования и доступ к объекту.',
    'Integration/data owner для tourism-data / RUSSPASS / booking dialogue.',
    'Согласование правил проведения supervised visitor pilot на площадке.',
    'Buyer-side IT / security / legal / procurement reviewers для formal working session.',
    'Решение о допустимом финансовом/договорном механизме после определения scope.'
  ],
  sharedDecisions: [
    'Что именно входит и не входит в первый пилот.',
    'Какие evidence являются достаточными для приёмки.',
    'Какие данные/интеграции разрешены и кто является их authority.',
    'Какие права получает каждая сторона на city-specific deliverables и reusable platform IP.',
    'Как фиксируются incident / support / content correction / provider-failure boundaries.',
    'Какой набор measured economics нужен для решения о следующем объекте/районе.',
    'Кто и на каком основании принимает отдельное Go / No-Go решение после пилота.'
  ],
  roles: [
    {
      id: 'project-team',
      title: 'Проектная команда',
      responsibility: [
        'Product / mobile / platform implementation.',
        'Heritage/spatial contracts и evidence packaging.',
        'Technical documentation и pilot instrumentation.',
        'Исправления по фактическим результатам поля и visitor research.'
      ],
      mustNotBeAssumed:
        'Проектная команда не является historical, legal, procurement или city-budget authority.'
    },
    {
      id: 'city-owner',
      title: 'Профильный владелец задачи',
      responsibility: [
        'Формулирует городскую задачу и границы пилота.',
        'Собирает профильные учреждения/службы.',
        'Подтверждает, кто принимает pilot result.',
        'Инициирует отдельное решение о следующей стадии.'
      ],
      mustNotBeAssumed:
        'Owner задачи не обязательно является конечным бюджетодержателем или закупающей организацией.'
    },
    {
      id: 'pilot-operator',
      title: 'Оператор / координатор пилота',
      responsibility: [
        'Формализует применимый pilot track.',
        'Согласует procedure / methodology / monitoring в своём контуре.',
        'Помогает отделить тестирование от последующего внедрения.'
      ],
      mustNotBeAssumed:
        'Участие оператора не означает автоматическую финансовую поддержку или последующий контракт.'
    },
    {
      id: 'heritage-authority',
      title: 'Heritage / content authority',
      responsibility: [
        'Источники и историческая экспертиза.',
        'Rights / reuse / publication review.',
        'Доступ к объектам и материалам.',
        'Review historical claims и reconstruction boundaries.'
      ],
      mustNotBeAssumed:
        'Историческая достоверность не определяется продуктовой командой, инвестором или рекламным партнёром.'
    },
    {
      id: 'integration-owner',
      title: 'Integration / data owner',
      responsibility: [
        'Формальный provider/feed/sandbox access.',
        'Schema / ID / freshness / attribution semantics.',
        'Booking/deep-link boundaries.',
        'Failure / retry / stale-data rules.'
      ],
      mustNotBeAssumed:
        'Публичный сайт или open-data register не становится live availability authority без соответствующего contract.'
    },
    {
      id: 'visitor-research',
      title: 'Visitor research owner',
      responsibility: [
        'Recruitment/consent вне app analytics.',
        'Организация supervised 20–50 participant wave.',
        'Observer discipline без coaching.',
        'Передача aggregate reports и qualitative notes в study pack.'
      ],
      mustNotBeAssumed:
        'Первый pilot не является статистически репрезентативным исследованием всех жителей или туристов Москвы.'
    }
  ] satisfies GovernmentPilotCharterRole[],
  phases: [
    {
      id: 'scope',
      title: '1 · Scope / owner / site',
      purpose:
        'Перевести интерес к проекту в конкретный bounded pilot с названными владельцами и площадкой.',
      requiredInputs: [
        'Названный city problem owner.',
        'Пилотная территория/объекты.',
        'Heritage/content contacts.',
        'Integration/data contact.',
        'Предварительный список buyer-side reviewers.'
      ],
      outputs: [
        'Согласованный предмет пилота.',
        'RACI / contacts.',
        'Список внешних inputs и access dependencies.',
        'Open questions для technical working session.'
      ],
      gate:
        'Нельзя переходить к formal pre-pilot approval, пока не названы owner, site и стороны, которые принимают evidence.'
    },
    {
      id: 'pre-pilot',
      title: '2 · Pre-pilot approval',
      purpose:
        'Согласовать доказательную методологию и эксплуатационные границы до начала физического теста.',
      requiredInputs: [
        'Technical specification.',
        'Acceptance matrix.',
        'Architecture / integration scheme.',
        'Security/data-flow note.',
        'IP/rights/handover matrix.',
        'Operations/SLA draft.'
      ],
      outputs: [
        'Approved/buyer-reviewed scope.',
        'Field/research permissions.',
        'Agreed evidence and reporting format.',
        'Confirmed integration approach or documented dependency.',
        'Chosen applicable pilot-contract/support path.'
      ],
      gate:
        'Repository technical-pack readiness не считается buyer approval: переход возможен только после внешнего review.'
    },
    {
      id: 'evidence',
      title: '3 · Evidence execution',
      purpose:
        'Получить реальные доказательства там, где software уже не может закрыть gate самостоятельно.',
      requiredInputs: [
        'Romanov field day: physical devices + survey/access.',
        'Old English Court real GLB/evidence/survey bundle.',
        '20–50 supervised visitor sessions.',
        'Formal live/provider access or explicit integration result.'
      ],
      outputs: [
        'Romanov field matrix / residual / persistent-anchor evidence.',
        'Second-object repeatability result.',
        'Visitor study report.',
        'Provider/integration evidence.',
        'Measured production inputs.'
      ],
      gate:
        'Ни один missing external proof нельзя закрывать презентацией, mock или ручным green status.'
    },
    {
      id: 'review',
      title: '4 · Final evidence review',
      purpose:
        'Отделить доказанные результаты от недоказанных и собрать measured economics.',
      requiredInputs: [
        'Final pilot report.',
        'Acceptance results.',
        'Rights/governance review.',
        'Measured cost / lead time / human effort / operations inputs.'
      ],
      outputs: [
        'Proven / not proven / blocked matrix.',
        'Measured unit economics.',
        'Known operational risks.',
        'Scope correction or scale recommendation inputs.'
      ],
      gate:
        'Система может сделать decision pack ready, но не принимает за город/инвестора политическое, бюджетное или инвестиционное решение.'
    },
    {
      id: 'next-stage',
      title: '5 · Separate next-stage decision',
      purpose:
        'После evidence отдельно определить, что именно продолжается и каким механизмом.',
      requiredInputs: [
        'Human Go / No-Go decision.',
        'Named buyer/owner for deployment if Go.',
        'Measured scope/cost for next object or district.',
        'If scaling outside Moscow: first-region candidate and authority.'
      ],
      outputs: [
        'Deployment / license / integration path, если применимо.',
        'Investment review, если economics достаточны.',
        'First external region plan, если Moscow proof decision-ready.',
        'Explicit No-Go / re-scope, если gates не пройдены.'
      ],
      gate:
        'Пилот не конвертируется автоматически в закупку, инвестиции, региональное или федеральное финансирование.'
    }
  ] satisfies GovernmentPilotCharterPhase[]
};

export function getGovernmentPilotCharterReadiness() {
  return {
    workingModelReady: true,
    cityOwnerConfirmed: false,
    pilotSiteConfirmed: false,
    buyerReviewCompleted: false,
    physicalEvidenceCompleted: false,
    visitorEvidenceCompleted: false,
    providerAccessConfirmed: false,
    nextStageDecisionMade: false,
    currentGate: 'scope' as GovernmentPilotCharterPhaseId
  };
}
