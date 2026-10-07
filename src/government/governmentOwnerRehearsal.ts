import type { AppLanguage } from '../i18n';
import type { GovernmentOwnerRouteDestination } from './governmentOwnerRoute.ts';

export type GovernmentOwnerRehearsalNote = {
  stepId: string;
  speakerCue: string;
  executiveObjection: string;
  objectionResponse: string;
  doNotPromise: string;
  closeCue: string;
  shortcuts: Array<{
    label: string;
    destination: GovernmentOwnerRouteDestination;
  }>;
};

const ru: GovernmentOwnerRehearsalNote[] = [
  {
    stepId: 'city-problem',
    speakerCue: 'Открыть не с технологии, а с разрыва между намерением туриста и фактическим исполнением дня.',
    executiveObjection: 'У Москвы уже есть туристические сервисы. Зачем ещё один?',
    objectionResponse: 'Мы не заменяем каталог или городской портал. Мы закрываем слой исполнения: план → бронь/билет → маршрут → provider truth → подтверждённое посещение → evidence.',
    doNotPromise: 'Не утверждать, что текущие городские сервисы «не работают» или что Moscow должен их заменить.',
    closeCue: 'Зафиксировать: покупается операционный слой исполнения и измерения, а не ещё один каталог.',
    shortcuts: [
      { label: 'Executive Control', destination: 'control' },
      { label: 'Traveler flow', destination: 'product' }
    ]
  },
  {
    stepId: 'traveler-utility',
    speakerCue: 'Показать один день пользователя и только один сценарий изменения плана.',
    executiveObjection: 'Почему турист не сделает это в картах, поиске и мессенджере?',
    objectionResponse: 'Отдельные инструменты помогают найти или проложить путь. Здесь ценность в связанном состоянии поездки: fixed commitments, flexible windows, confirmed provider state и история фактических посещений.',
    doNotPromise: 'Не обещать, что пользователь откажется от карт или поисковиков.',
    closeCue: 'Перевести разговор с «ещё одно приложение» на «единое состояние поездки».',
    shortcuts: [
      { label: 'Product flow', destination: 'product' },
      { label: 'Pilot acceptance', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'city-buys',
    speakerCue: 'Назвать 4–5 передаваемых артефактов и сразу связать их с acceptance.',
    executiveObjection: 'Что остаётся у города, если подрядчик завтра уйдёт?',
    objectionResponse: 'Первый контракт должен фиксировать deliverables, integration contracts, evidence pack, handover и operating rights/ownership boundaries. Именно поэтому Contract Builder встроен в MVP.',
    doNotPromise: 'Не утверждать право собственности на код или данные, пока это не закреплено договором.',
    closeCue: 'Закрыть вопрос vendor lock-in через handover и contract scope, а не словами.',
    shortcuts: [
      { label: 'Deliverables', destination: 'deliverables' },
      { label: 'Contract Builder', destination: 'contract' }
    ]
  },
  {
    stepId: 'partner-economics',
    speakerCue: 'Сначала объяснить ценность партнёру, потом монетизацию платформы.',
    executiveObjection: 'Почему партнёры будут интегрироваться и платить?',
    objectionResponse: 'Потому что получают измеримый handoff и подтверждённую транзакцию. Но willingness-to-pay и unit economics должны быть доказаны пилотом, а не заявлены заранее.',
    doNotPromise: 'Не называть ARR/MRR, CAC/LTV или take rate как факт без реальных контрактов.',
    closeCue: 'Подчеркнуть: monetization follows verified demand, а не наоборот.',
    shortcuts: [
      { label: 'Partner economics', destination: 'ecosystem' },
      { label: 'Revenue model', destination: 'money' }
    ]
  },
  {
    stepId: 'demand-marketplace',
    speakerCue: 'Отдельно проговорить органическое ранжирование и sponsor inventory.',
    executiveObjection: 'Это не превратится в рекламную витрину?',
    objectionResponse: 'Organic ranking и paid sponsorship разделены policy. Sponsored placement не покупает место в organic shortlist.',
    doNotPromise: 'Не утверждать полную алгоритмическую нейтральность как доказанный production-факт до реальных audit/logs.',
    closeCue: 'Зафиксировать governance principle: paid ≠ organic rank.',
    shortcuts: [
      { label: 'Marketplace policy', destination: 'operations' },
      { label: 'Partner layer', destination: 'ecosystem' }
    ]
  },
  {
    stepId: 'district-opportunity',
    speakerCue: 'Показать один persistent gap и одну цепочку его закрытия.',
    executiveObjection: 'Почему unmet demand означает, что надо что-то строить или субсидировать?',
    objectionResponse: 'Не означает. Gap только создаёт investigation/acquisition brief. Решение может быть supply, часы работы, provider reliability, маршрут или вообще no action.',
    doNotPromise: 'Не выдавать correlation между gap и необходимостью CAPEX за causal conclusion.',
    closeCue: 'Сделать акцент: система сначала диагностирует, а не назначает инвестицию.',
    shortcuts: [
      { label: 'Demand Control', destination: 'operations' },
      { label: 'City Opportunity', destination: 'operations' }
    ]
  },
  {
    stepId: 'digital-twin',
    speakerCue: 'Показать baseline и один intervention; не листать все сценарии.',
    executiveObjection: 'Почему мы должны верить симуляции?',
    objectionResponse: 'Не должны верить безусловно. ACTUAL-сценарий блокируется без measured calibration, а после запуска прогноз сравнивается с observed outcome.',
    doNotPromise: 'Не называть expected output фактом, ROI или causal effect.',
    closeCue: 'Продать не «точный прогноз», а дисциплину scenario → verify → recalibrate.',
    shortcuts: [
      { label: 'Digital Twin', destination: 'operations' },
      { label: 'Model risk', destination: 'operations' }
    ]
  },
  {
    stepId: 'capital-portfolio',
    speakerCue: 'Показать budget constraint и почему один вариант не вошёл.',
    executiveObjection: 'Алгоритм теперь будет решать, куда городу тратить деньги?',
    objectionResponse: 'Нет. Optimizer формирует recommendation-only shortlist; investmentDecision=false. Решение проходит человеческий governance.',
    doNotPromise: 'Не использовать формулировки «оптимальный бюджет» или «лучшее решение» без оговорки о policy/assumptions.',
    closeCue: 'Закрыть: это decision support, не распорядитель бюджета.',
    shortcuts: [
      { label: 'Portfolio Optimizer', destination: 'operations' },
      { label: 'Investment Committee', destination: 'operations' }
    ]
  },
  {
    stepId: 'committee-governance',
    speakerCue: 'Показать один blocker и его путь до approval/commitment.',
    executiveObjection: 'Вы моделируете закупочную процедуру Правительства Москвы?',
    objectionResponse: 'Нет. Система не выбирает юридическую процедуру. Она требует confirmed procurement path и review reference от ответственной функции.',
    doNotPromise: 'Не утверждать соответствие конкретной процедуре закупки без юридического review.',
    closeCue: 'Подчеркнуть: governance фиксирует полномочия, а не подменяет их.',
    shortcuts: [
      { label: 'Committee workspace', destination: 'operations' },
      { label: 'Contract Builder', destination: 'contract' }
    ]
  },
  {
    stepId: 'programme-control',
    speakerCue: 'Сравнить committed, actual и uncommitted на одном экране.',
    executiveObjection: 'Если деньги не потрачены, почему их нельзя сразу перераспределить?',
    objectionResponse: 'Потому что committed-but-unspent ≠ available. Сначала review/decommitment authority, потом новый funding decision.',
    doNotPromise: 'Не показывать потенциально высвобождаемую сумму как уже свободный бюджет.',
    closeCue: 'Закрыть различие committed / actual / available.',
    shortcuts: [
      { label: 'Programme Control', destination: 'operations' },
      { label: 'Rebalancing Board', destination: 'operations' }
    ]
  },
  {
    stepId: 'learning-model-risk',
    speakerCue: 'Показать одну ошибку прогноза и как она снижает confidence.',
    executiveObjection: 'Самообучающаяся модель не начнёт менять правила без контроля?',
    objectionResponse: 'Нет. Calibration сначала proposal, затем holdout, acceptance, policy version и отдельная activation. Auto-activation запрещена.',
    doNotPromise: 'Не называть систему автономной или самостоятельно принимающей production-решения.',
    closeCue: 'Продать self-calibration с governance, а не autonomous AI.',
    shortcuts: [
      { label: 'Learning Loop', destination: 'operations' },
      { label: 'Model Risk Board', destination: 'operations' }
    ]
  },
  {
    stepId: 'audit-decision',
    speakerCue: 'Закончить не audit-технологией, а вопросом: «можем ли мы через год доказать, почему приняли решение?»',
    executiveObjection: 'Hash-chain — это блокчейн? Зачем такая сложность?',
    objectionResponse: 'Нет. Это append-only integrity mechanism для обнаружения переписывания истории и воспроизводимого decision replay. Блокчейн для этого не требуется.',
    doNotPromise: 'Не заявлять юридическую неизменяемость или криптографическую неоспоримость уровня qualified signature.',
    closeCue: 'Сразу перейти к Pilot Brief и конкретному решению первого контракта.',
    shortcuts: [
      { label: 'Acceptance', destination: 'acceptance' },
      { label: 'Contract Builder', destination: 'contract' }
    ]
  }
];

function localize(base: GovernmentOwnerRehearsalNote[], language: AppLanguage) {
  if (language === 'ru') return base;
  if (language === 'en') {
    return base.map((item) => ({
      ...item,
      speakerCue: item.speakerCue,
      executiveObjection: item.executiveObjection,
      objectionResponse: item.objectionResponse,
      doNotPromise: item.doNotPromise,
      closeCue: item.closeCue,
      shortcuts: item.shortcuts.map((shortcut) => ({ ...shortcut }))
    }));
  }
  return base;
}

export function getGovernmentOwnerRehearsalNotes(language: AppLanguage) {
  return localize(ru, language);
}
