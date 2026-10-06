import type { GovernmentOwnerRouteDestination } from './governmentOwnerRoute.ts';

export type GovernmentRehearsalCue = {
  stepId: string;
  sayThis: string;
  likelyObjection: string;
  answer: string;
  doNotClaim: string;
  transition: string;
  evidenceJumps: Array<{
    label: string;
    destination: GovernmentOwnerRouteDestination;
  }>;
};

export const governmentRehearsalCuesRu: GovernmentRehearsalCue[] = [
  {
    stepId: 'city-problem',
    sayThis: 'Мы не продаём ещё один каталог Москвы. Мы собираем исполнимый туристический день и одновременно создаём для города измеримый контур результата.',
    likelyObjection: 'Почему это не Яндекс Карты, Russpass или набор существующих сервисов?',
    answer: 'Покажите не перечень функций, а замкнутый путь: intent → plan → provider confirmation → visit evidence → demand gap → city action. Не утверждайте, что конкуренты этого не умеют без отдельного сравнения.',
    doNotClaim: 'Не говорить, что Москва сегодня совсем не видит туристические данные или что существующие городские сервисы не работают.',
    transition: 'Сначала покажем, почему турист вообще будет возвращаться в продукт каждый день поездки.',
    evidenceJumps: [
      { label: 'Executive Control', destination: 'control' },
      { label: 'Traveler flow', destination: 'product' }
    ]
  },
  {
    stepId: 'traveler-utility',
    sayThis: 'Главная привычка — открыть Today и увидеть не список мест, а свой реально исполнимый день с билетами, бронями, окнами и перестроением.',
    likelyObjection: 'Зачем туристу ещё одно приложение?',
    answer: 'Ответ должен быть поведенческим: оно экономит время именно во время поездки и хранит историю посещённого. Не продавать установку приложения как самоцель.',
    doNotClaim: 'Не обещать retention, DAU или рост посещаемости без реального пилота.',
    transition: 'Если пользовательская ценность понятна, следующий вопрос — что именно город покупает.',
    evidenceJumps: [
      { label: 'Traveler product', destination: 'product' },
      { label: 'Acceptance', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'city-buys',
    sayThis: 'Первый контракт должен оставлять у города конкретные операционные активы, интеграционные контракты и evidence pack — не презентацию.',
    likelyObjection: 'Что останется после окончания пилота и ухода подрядчика?',
    answer: 'Покажите deliverables, handover и acceptance. Акцент — на передаваемом контуре и формальных доказательствах.',
    doNotClaim: 'Не обещать полный vendor independence, пока не проверены реальные права, инфраструктура и handover.',
    transition: 'Дальше — почему к этому контуру будут подключаться коммерческие партнёры.',
    evidenceJumps: [
      { label: 'Deliverables', destination: 'deliverables' },
      { label: 'Contract Builder', destination: 'contract' }
    ]
  },
  {
    stepId: 'partner-economics',
    sayThis: 'Партнёр получает не баннер, а измеримый спрос: handoff, confirmation, attribution и settlement evidence.',
    likelyObjection: 'Партнёры будут платить только за рекламу — зачем им ещё один канал?',
    answer: 'Покажите B2B value chain и разделение organic utility от sponsorship. Коммерческая модель должна быть подтверждена пилотными договорами, а не только интерфейсом.',
    doNotClaim: 'Не называть будущий ARR/MRR и take rate фактом без контрактов.',
    transition: 'Теперь покажем, как монетизировать спрос, не превращая городской сервис в рекламную ленту.',
    evidenceJumps: [
      { label: 'Partner economics', destination: 'ecosystem' },
      { label: 'Revenue model', destination: 'money' }
    ]
  },
  {
    stepId: 'demand-marketplace',
    sayThis: 'Органический выбор и платное продвижение разведены. Это защищает доверие пользователя и делает коммерциализацию управляемой.',
    likelyObjection: 'Кто гарантирует, что платный партнёр не купит себе первое место?',
    answer: 'Покажите ranking policy и sponsor-neutral organic rank. Если потребуется юридическая/регуляторная гарантия — это отдельный governance review.',
    doNotClaim: 'Не утверждать абсолютную нейтральность реальной production-системы до независимой проверки данных и алгоритма.',
    transition: 'Следующий уровень — агрегировать эти сигналы и увидеть, где спрос в городе не закрыт.',
    evidenceJumps: [
      { label: 'Marketplace ranking', destination: 'operations' },
      { label: 'Governance', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'district-opportunity',
    sayThis: 'Когда unmet intent повторяется и supply недостаточен, продукт превращает пользовательское трение в управляемую возможность района.',
    likelyObjection: 'Это не просто красивая тепловая карта?',
    answer: 'Покажите threshold, evidence window, provider confirmation и цикл gap → partner brief → onboarding → повторное измерение.',
    doNotClaim: 'Не выдавать корреляцию спроса за доказанную необходимость строительства или бюджетного решения.',
    transition: 'После обнаружения gap город может сравнить интервенции до расходов.',
    evidenceJumps: [
      { label: 'Demand Control', destination: 'operations' },
      { label: 'Pilot evidence', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'digital-twin',
    sayThis: 'Digital Twin здесь не предсказывает будущее как факт. Он дисциплинирует сравнение сценариев и обязан потом проверить себя на реальном результате.',
    likelyObjection: 'Почему мы должны доверять этим прогнозам?',
    answer: 'Ответ — не “потому что модель умная”. Покажите measured calibration gate, confidence, post-launch verification и запрет ACTUAL без evidence.',
    doNotClaim: 'Не говорить о точности production-модели до реальной calibration history.',
    transition: 'Сценарии нужны не сами по себе — они становятся входом в сравнение капитала.',
    evidenceJumps: [
      { label: 'Digital Twin', destination: 'operations' },
      { label: 'Model evidence', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'capital-portfolio',
    sayThis: 'Optimizer не распоряжается бюджетом. Он делает альтернативы сопоставимыми и формирует shortlist внутри заданного envelope.',
    likelyObjection: 'Вы предлагаете алгоритму решать, куда Москве тратить бюджет?',
    answer: 'Нет. Покажите recommendationOnly, human approval gate и budget constraint. Решение и ответственность остаются у уполномоченных людей.',
    doNotClaim: 'Не называть shortlist инвестиционным решением или утверждённым бюджетом.',
    transition: 'Именно поэтому следующий экран — не “автопокупка”, а Investment Committee governance.',
    evidenceJumps: [
      { label: 'Portfolio Optimizer', destination: 'operations' },
      { label: 'Committee governance', destination: 'operations' }
    ]
  },
  {
    stepId: 'committee-governance',
    sayThis: 'До capital commitment должны закрыться owner, funding source, procurement path, evidence package и последовательные approvals.',
    likelyObjection: 'А кто определяет закупочную процедуру и юридическую допустимость?',
    answer: 'Не система. Она хранит только подтверждённый procurement route и review reference от ответственной функции.',
    doNotClaim: 'Не консультировать на встрече о конкретной юридической процедуре без правового заключения.',
    transition: 'После одобрения нужен контроль уже не одного кейса, а всей программы.',
    evidenceJumps: [
      { label: 'Investment Committee', destination: 'operations' },
      { label: 'Contract clauses', destination: 'contract' }
    ]
  },
  {
    stepId: 'programme-control',
    sayThis: 'В портфеле мы жёстко разделяем committed, actual, uncommitted и committed-but-unspent — это разные деньги с разными правами.',
    likelyObjection: 'Можно ли автоматически перекинуть неиспользованные деньги на лучший проект?',
    answer: 'Нет. Underperformance создаёт review candidate; committed capital остаётся заблокирован до formal decommitment и нового approval.',
    doNotClaim: 'Не описывать reallocation candidate как уже свободный бюджет.',
    transition: 'Дальше система использует результаты не только для денег, но и для улучшения собственных прогнозов.',
    evidenceJumps: [
      { label: 'Programme Control', destination: 'operations' },
      { label: 'Decision gates', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'learning-model-risk',
    sayThis: 'Система измеряет собственные ошибки. Плохой сегмент снижает confidence, а новая calibration проходит holdout, acceptance и отдельную activation.',
    likelyObjection: 'Самообучающаяся модель не начнёт сама менять правила?',
    answer: 'Нет. Auto-activation, auto-promotion и auto-rollback запрещены. Покажите lineage, challenger gate и rollback authority.',
    doNotClaim: 'Не использовать формулировку “ИИ сам улучшает город”; обучение здесь governance-controlled.',
    transition: 'Последний вопрос — можем ли мы через год доказать всю историю решения.',
    evidenceJumps: [
      { label: 'Learning & Model Risk', destination: 'operations' },
      { label: 'Audit evidence', destination: 'acceptance' }
    ]
  },
  {
    stepId: 'audit-decision',
    sayThis: 'Финальный аргумент — не AI и не dashboard. Это воспроизводимое решение: данные, модель, approvals, деньги, исполнение, outcome и learning в одной цепочке.',
    likelyObjection: 'Можно ли потом переписать историю или объяснить неудачу задним числом?',
    answer: 'Audit Ledger append-only и hash-chained; tampering ломает integrity verification. Для production потребуется реальное защищённое хранилище и операционная политика доступа.',
    doNotClaim: 'Не называть текущую demo hash-chain полноценной юридически значимой или криптографически сертифицированной системой.',
    transition: 'После этого не показываем новые функции — переходим к одному pilot ask.',
    evidenceJumps: [
      { label: 'Audit / Acceptance', destination: 'acceptance' },
      { label: 'Pilot decision', destination: 'contract' }
    ]
  }
];

export function getGovernmentRehearsalCue(stepId: string) {
  return governmentRehearsalCuesRu.find((item) => item.stepId === stepId) ?? null;
}
