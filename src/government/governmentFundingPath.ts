import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness
} from './pilotInvestmentDecision.ts';

export const GOVERNMENT_FUNDING_PATH_VERSION = 1 as const;

export type GovernmentFundingStage =
  | 'pilot'
  | 'deployment'
  | 'investment'
  | 'regional-federal';

export type GovernmentFundingStatus =
  | 'candidate-now'
  | 'after-pilot'
  | 'after-measured-economics'
  | 'after-regional-proof';

export type GovernmentFundingMechanism = {
  id: string;
  stage: GovernmentFundingStage;
  status: GovernmentFundingStatus;
  title: string;
  actor: string;
  purpose: string;
  entryGate: string;
  officialBasis: string;
  projectUse: string;
  boundary: string;
};

export type GovernmentFundingPath = {
  version: typeof GOVERNMENT_FUNDING_PATH_VERSION;
  title: string;
  subtitle: string;
  mechanisms: GovernmentFundingMechanism[];
  principle: string;
};

export const governmentFundingPath: GovernmentFundingPath = {
  version: GOVERNMENT_FUNDING_PATH_VERSION,
  title: 'Funding Path · от пилота к масштабу',
  subtitle: 'Деньги появляются по разным основаниям и на разных стадиях',
  principle:
    'Пилотная поддержка, городской контракт, инвестиционный капитал и федеральная/региональная поддержка — разные решения. Одно не означает автоматического получения другого.',
  mechanisms: [
    {
      id: 'moscow-pilot-support',
      stage: 'pilot',
      status: 'candidate-now',
      title: 'Москва · поддержка пилотного тестирования',
      actor: 'Фонд «Московский инновационный кластер» / городской pilot-support contour',
      purpose:
        'Компенсация или поддержка допустимых расходов, непосредственно связанных с проведением согласованного пилотного тестирования.',
      entryGate:
        'Формальный пилот, соответствие требованиям меры, отдельная заявка, подтверждающие документы и смета.',
      officialBasis:
        'Постановление Правительства Москвы № 410-ПП; операторский контур актуализирован изменениями 2025 года.',
      projectUse:
        'Рассматривать для bounded pilot «Варварка во времени» после определения площадки и сметы.',
      boundary:
        'Статус участника пилота сам по себе не означает одобрение финансовой поддержки и не гарантирует конкретную сумму.'
    },
    {
      id: 'moscow-deployment',
      stage: 'deployment',
      status: 'after-pilot',
      title: 'Москва · внедрение после пилота',
      actor: 'Конкретный профильный заказчик / учреждение / городской цифровой контур',
      purpose:
        'Внедрение, лицензирование, интеграция, эксплуатация и производство следующего территориального пакета.',
      entryGate:
        'Положительный результат пилота, определённый buyer/budget owner, scope, IP/hosting/security/SLA и применимая договорная процедура.',
      officialBasis:
        'Конкретный механизм зависит от заказчика и предмета: договор, закупка, лицензия, интеграционный проект или иной допустимый контур.',
      projectUse:
        'Первый коммерческий rollout после доказанной Варварки — следующий объект/район с измеренной unit economics.',
      boundary:
        'Нельзя заранее объявлять форму закупки, бюджетодержателя или сумму до определения конкретного заказчика.'
    },
    {
      id: 'investment-scale',
      stage: 'investment',
      status: 'after-measured-economics',
      title: 'Инвестиции · масштабирование платформы',
      actor: 'Инвестиционные институты / венчурные и частные соинвесторы',
      purpose:
        'Финансирование роста платформы, команды, production capacity, регионального onboarding и коммерческого масштабирования.',
      entryGate:
        'Physical proof + second-object repeatability + visitor proof + governance + измеренная стоимость/срок следующего объекта и района.',
      officialBasis:
        'Отдельный инвестиционный процесс; он не подменяет городской пилот и не следует из него автоматически.',
      projectUse:
        'Финансировать переход от одного доказанного пилота к повторяемой production machine и нескольким заказчикам/регионам.',
      boundary:
        'До measured economics нельзя защищать valuation, ROI или размер раунда на придуманных предпосылках.'
    },
    {
      id: 'regional-federal',
      stage: 'regional-federal',
      status: 'after-regional-proof',
      title: 'Регион / федерация · туристический масштаб',
      actor: 'Субъект РФ + федеральный туристический контур + профильные институты',
      purpose:
        'Региональные и межрегиональные туристические проекты, цифровые сервисы, маршруты, событийные и инфраструктурные меры в применимом контуре.',
      entryGate:
        'Москва как reference city → первый внешний регион → generic DestinationPackage proof → interregional journey → отдельная программа/соглашение.',
      officialBasis:
        'Национальный проект «Туризм и гостеприимство» и государственная программа «Развитие туризма» предусматривают региональную поддержку и цифровые туристические сервисы.',
      projectUse:
        'Предлагать не “московское приложение”, а стандарт подключения региона + verified heritage infrastructure + journey/orchestration layer.',
      boundary:
        'Единая субсидия направляется субъектам РФ по установленным правилам; проект не получает федеральное финансирование автоматически.'
    }
  ]
};

export function getGovernmentFundingPathState() {
  const readiness = getPilotDecisionReadiness(currentPilotInvestmentEvidence);

  return {
    currentFocus: 'moscow-pilot-support' as const,
    deploymentUnlocked: readiness.proofReady && readiness.governanceReady,
    investmentReviewUnlocked: readiness.decisionPackReady,
    federalDialogueUnlocked: false,
    mechanisms: governmentFundingPath.mechanisms.map((mechanism) => ({
      id: mechanism.id,
      status: mechanism.status,
      unlocked:
        mechanism.id === 'moscow-pilot-support'
          ? true
          : mechanism.id === 'moscow-deployment'
            ? readiness.proofReady && readiness.governanceReady
            : mechanism.id === 'investment-scale'
              ? readiness.decisionPackReady
              : false
    }))
  };
}
