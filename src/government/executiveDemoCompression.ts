import type { AppLanguage } from '../i18n';
import type { GovernmentOwnerRouteDestination } from './governmentOwnerRoute.ts';

export type ExecutiveCompressedStep = {
  stepId: string;
  durationSeconds: number;
  thesis: string;
  proof: string;
  objection: string;
  answer: string;
  next: string;
  proofDestination: GovernmentOwnerRouteDestination;
};

const durations = [45, 55, 50, 45, 50, 55, 60, 55, 60, 55, 60, 50] as const;

const ru: ExecutiveCompressedStep[] = [
  {
    stepId: 'city-problem',
    durationSeconds: durations[0],
    thesis: 'Москва покупает не ещё один туристический каталог, а управляемый слой исполнения туристического дня.',
    proof: 'Executive Control связывает pilot scope, deliverables, acceptance, city KPI и scale decision.',
    objection: 'У Москвы уже есть туристические сервисы. Зачем ещё один?',
    answer: 'Мы не заменяем каталог или городской портал: закрываем путь plan → booking/ticket → route → provider truth → confirmed visit → evidence.',
    next: 'Показать, зачем этот слой нужен самому туристу.',
    proofDestination: 'control'
  },
  {
    stepId: 'traveler-utility',
    durationSeconds: durations[1],
    thesis: 'Для туриста ценность — один исполнимый день, который знает фиксированные обязательства и умеет перестраивать только гибкую часть.',
    proof: 'Product flow: plan → Today → route → ticket/reservation → visit → My Moscow.',
    objection: 'Почему не использовать карты, поиск и мессенджер?',
    answer: 'Они решают отдельные задачи; здесь хранится единое состояние поездки: commitments, flexible windows, provider truth и visit history.',
    next: 'Показать, что именно остаётся у города после контракта.',
    proofDestination: 'product'
  },
  {
    stepId: 'city-buys',
    durationSeconds: durations[2],
    thesis: 'Первый контракт покупает передаваемые цифровые активы и доказательный pilot pack, а не презентацию.',
    proof: 'Reference client, district package, Heritage Studio, Journey Control Center, integration contracts и formal handover.',
    objection: 'Что останется у Москвы, если подрядчик уйдёт?',
    answer: 'Именно поэтому deliverables, operating boundaries, integration contracts, evidence pack и handover входят в предмет пилота.',
    next: 'Показать, почему партнёры готовы участвовать в таком контуре.',
    proofDestination: 'deliverables'
  },
  {
    stepId: 'partner-economics',
    durationSeconds: durations[3],
    thesis: 'Партнёру система продаёт не рекламный показ, а измеримый переход от туристического намерения к подтверждённой транзакции.',
    proof: 'Partner operating chain: onboarding → availability → handoff → provider confirmation → attribution → revenue ledger → settlement.',
    objection: 'Почему партнёры будут интегрироваться и платить?',
    answer: 'Потому что получают квалифицированный спрос и доказуемый attribution; willingness-to-pay и unit economics должны подтвердиться пилотом.',
    next: 'Показать, как монетизация не ломает доверие к городскому сервису.',
    proofDestination: 'ecosystem'
  },
  {
    stepId: 'demand-marketplace',
    durationSeconds: durations[4],
    thesis: 'Коммерческий спрос можно монетизировать, не продавая место в органической выдаче.',
    proof: 'Organic ranking использует relevance, distance, time, availability, preference и service quality; sponsorship живёт отдельно.',
    objection: 'Это не станет рекламной витриной?',
    answer: 'Paid sponsorship не меняет organic shortlist; коммерческий слой отделён от полезности для туриста.',
    next: 'Перейти от отдельного предложения к незакрытому спросу района.',
    proofDestination: 'operations'
  },
  {
    stepId: 'district-opportunity',
    durationSeconds: durations[5],
    thesis: 'Persistent unmet demand становится не инвестиционным решением, а проверяемой opportunity для района.',
    proof: 'Demand Control Tower → acquisition brief → partner shortlist → post-onboarding measurement → gap closed / still open.',
    objection: 'Unmet demand означает, что надо строить новое?',
    answer: 'Нет. Gap запускает диагностику; ответом может быть supply, часы работы, provider reliability, маршрут или no action.',
    next: 'Показать, как город сравнивает возможные интервенции до затрат капитала.',
    proofDestination: 'operations'
  },
  {
    stepId: 'digital-twin',
    durationSeconds: durations[6],
    thesis: 'Digital Twin нужен не для “предсказать будущее”, а чтобы сравнить сценарии и потом проверить ошибку модели.',
    proof: 'Baseline → intervention → expected delta → post-launch verification; ACTUAL блокируется без measured calibration.',
    objection: 'Почему мы должны верить симуляции?',
    answer: 'Не должны безусловно: прогноз имеет confidence, а после запуска сравнивается с observed outcome и влияет на следующую calibration.',
    next: 'Показать, как несколько интервенций сравниваются при ограниченном бюджете.',
    proofDestination: 'operations'
  },
  {
    stepId: 'capital-portfolio',
    durationSeconds: durations[7],
    thesis: 'При ограниченном envelope система формирует shortlist вариантов, но не распоряжается бюджетом.',
    proof: 'Portfolio Optimizer сравнивает impact, confidence, risk, implementation time и capital efficiency под budget constraint.',
    objection: 'Алгоритм будет решать, куда тратить городские деньги?',
    answer: 'Нет: это recommendation-only; investmentDecision=false, а capital commitment появляется только после governance.',
    next: 'Показать формальный переход от рекомендации к решению комитета.',
    proofDestination: 'operations'
  },
  {
    stepId: 'committee-governance',
    durationSeconds: durations[8],
    thesis: 'Рекомендация превращается в committed capital только после owners, evidence, procurement path и approvals.',
    proof: 'Investment Committee Workspace: business case → sponsor/owner → budget source → evidence package → approval stages → commitment.',
    objection: 'Система сама определяет закупочную процедуру?',
    answer: 'Нет. Она требует confirmed procurement path и authority reference от ответственной функции, но не подменяет юридическое решение.',
    next: 'Показать, как после approval контролируется весь портфель программы.',
    proofDestination: 'operations'
  },
  {
    stepId: 'programme-control',
    durationSeconds: durations[9],
    thesis: 'После approval город видит отдельно authorized, committed, actual и действительно available capital.',
    proof: 'Capital Programme Control Tower показывает execution, benefits, underperformance и reallocation opportunities без auto-reallocation.',
    objection: 'Если деньги не потрачены, почему их нельзя сразу перебросить?',
    answer: 'Committed-but-unspent не является available: сначала formal review/decommitment, затем новое решение о финансировании.',
    next: 'Показать, как результаты программы изменяют доверие к модели.',
    proofDestination: 'operations'
  },
  {
    stepId: 'learning-model-risk',
    durationSeconds: durations[10],
    thesis: 'Система обязана учиться на ошибках, но не имеет права сама менять production-модель.',
    proof: 'Forecast error → segment confidence → calibration proposal → holdout → acceptance → version → explicit activation.',
    objection: 'Самообучение не начнёт менять правила без контроля?',
    answer: 'Нет: auto-activation, auto-promotion и auto-rollback запрещены; новая версия проходит model-risk governance.',
    next: 'Закончить доказательством того, что вся история решения воспроизводима.',
    proofDestination: 'operations'
  },
  {
    stepId: 'audit-decision',
    durationSeconds: durations[11],
    thesis: 'Через год город должен суметь доказать, почему решение было принято, что произошло и чему система научилась.',
    proof: 'Audit Ledger связывает data snapshot, model/policy version, scenario, approvals, capital, execution, outcome, learning и model change.',
    objection: 'Зачем hash-chain, это блокчейн?',
    answer: 'Нет. Это append-only integrity mechanism: переписывание истории обнаруживается, а decision replay воспроизводит исходный контекст.',
    next: 'Перейти к одному решению встречи: согласовать доказательный пилот Варварка — Зарядье.',
    proofDestination: 'acceptance'
  }
];

const en: ExecutiveCompressedStep[] = [
  ['city-problem','Moscow is not buying another tourism catalogue; it is buying a governed execution layer for the traveler day.','Executive Control connects pilot scope, deliverables, acceptance, city KPI and scale decision.','Moscow already has tourism services. Why another one?','We do not replace the city portal or catalogue; we close plan → booking/ticket → route → provider truth → confirmed visit → evidence.','Show why the execution layer matters to the traveler.','control'],
  ['traveler-utility','For the traveler, the value is one executable day that protects fixed commitments and replans only the flexible layer.','Product flow: plan → Today → route → ticket/reservation → visit → My Moscow.','Why not use maps, search and messaging?','Those tools solve separate tasks; this keeps one trip state: commitments, flexible windows, provider truth and visit history.','Show what remains with the city after the contract.','product'],
  ['city-buys','The first contract buys transferable digital assets and an evidence pilot pack, not a presentation.','Reference client, district package, Heritage Studio, Journey Control Center, integration contracts and formal handover.','What remains if the contractor leaves?','That is why deliverables, operating boundaries, integration contracts, evidence pack and handover are part of the pilot scope.','Show why partners participate in this operating model.','deliverables'],
  ['partner-economics','For a partner, the product sells measurable demand-to-transaction handoff, not an ad impression.','Partner chain: onboarding → availability → handoff → provider confirmation → attribution → revenue ledger → settlement.','Why would partners integrate and pay?','They get qualified demand and evidence-backed attribution; willingness-to-pay and unit economics must be proven in the pilot.','Show how monetization stays separate from public-service trust.','ecosystem'],
  ['demand-marketplace','Commercial demand can be monetized without selling organic rank.','Organic ranking uses relevance, distance, time, availability, preference and service quality; sponsorship is separate.','Will this become an advertising feed?','Paid sponsorship does not alter the organic shortlist; commercial inventory is separated from traveler utility.','Move from individual offers to unmet district demand.','operations'],
  ['district-opportunity','Persistent unmet demand becomes a testable district opportunity, not an investment decision.','Demand Control Tower → acquisition brief → partner shortlist → post-onboarding measurement → gap closed / still open.','Does unmet demand mean the city should build something?','No. A gap triggers diagnosis; the answer may be supply, opening hours, provider reliability, routing or no action.','Show how intervention scenarios are compared before capital is spent.','operations'],
  ['digital-twin','The Digital Twin is for comparing scenarios and measuring model error, not pretending to predict the future.','Baseline → intervention → expected delta → post-launch verification; ACTUAL is blocked without measured calibration.','Why should we trust the simulation?','We should not trust it unconditionally: forecasts carry confidence and are compared with observed outcomes after launch.','Show how multiple interventions are compared under a budget constraint.','operations'],
  ['capital-portfolio','Under a constrained envelope, the system creates a shortlist but never allocates public money by itself.','Portfolio Optimizer compares impact, confidence, risk, implementation time and capital efficiency under a budget constraint.','Will the algorithm decide where city money goes?','No: it is recommendation-only; investmentDecision=false and capital commitment exists only after governance.','Show the formal path from recommendation to committee decision.','operations'],
  ['committee-governance','A recommendation becomes committed capital only after owners, evidence, procurement path and approvals.','Investment Committee Workspace: business case → sponsor/owner → budget source → evidence package → approval stages → commitment.','Does the system determine the procurement procedure?','No. It requires a confirmed procurement path and authority reference but does not replace the legal decision.','Show how the full programme is controlled after approval.','operations'],
  ['programme-control','After approval, the city sees authorized, committed, actual and truly available capital separately.','Capital Programme Control Tower shows execution, benefits, underperformance and reallocation opportunities without auto-reallocation.','If money is unspent, why not move it immediately?','Committed-but-unspent is not available: first formal review/decommitment, then a new funding decision.','Show how programme outcomes change confidence in the model.','operations'],
  ['learning-model-risk','The system must learn from errors but cannot change the production model by itself.','Forecast error → segment confidence → calibration proposal → holdout → acceptance → version → explicit activation.','Will self-learning change rules without control?','No: auto-activation, auto-promotion and auto-rollback are prohibited; new versions pass model-risk governance.','End with proof that the whole decision history is reproducible.','operations'],
  ['audit-decision','A year later, the city should be able to prove why a decision was made, what happened and what the system learned.','Audit Ledger binds data snapshot, model/policy version, scenario, approvals, capital, execution, outcome, learning and model change.','Why use a hash chain—is this blockchain?','No. It is an append-only integrity mechanism that detects history rewrites and supports reproducible decision replay.','Move to one meeting decision: agree the Varvarka — Zaryadye evidence pilot.','acceptance']
].map((row,index) => ({
  stepId: row[0] as string,
  durationSeconds: durations[index]!,
  thesis: row[1] as string,
  proof: row[2] as string,
  objection: row[3] as string,
  answer: row[4] as string,
  next: row[5] as string,
  proofDestination: row[6] as GovernmentOwnerRouteDestination
}));

const zh: ExecutiveCompressedStep[] = [
  ['city-problem','莫斯科购买的不是又一个旅游目录，而是游客一天行程的可治理执行层。','Executive Control 将 pilot scope、deliverables、acceptance、city KPI 与 scale decision 连接起来。','莫斯科已经有旅游服务，为什么还需要一个？','我们不替代城市门户或目录，而是补齐 plan → booking/ticket → route → provider truth → confirmed visit → evidence。','下一步说明为什么这个执行层对游客本身有价值。','control'],
  ['traveler-utility','对游客而言，价值是一个可执行的一天：固定承诺不被破坏，只重排灵活部分。','Product flow：plan → Today → route → ticket/reservation → visit → My Moscow。','为什么不用地图、搜索和聊天工具？','这些工具解决单点问题；这里保存的是统一旅行状态：commitments、flexible windows、provider truth 与 visit history。','下一步说明合同结束后城市真正保留什么。','product'],
  ['city-buys','首份合同购买的是可移交数字资产和证据型 pilot pack，而不是演示。','Reference client、district package、Heritage Studio、Journey Control Center、integration contracts 与 formal handover。','如果供应商退出，城市还剩什么？','因此 deliverables、operating boundaries、integration contracts、evidence pack 与 handover 必须写入 pilot scope。','下一步说明合作伙伴为什么愿意参与。','deliverables'],
  ['partner-economics','对合作伙伴，平台提供的是从游客意图到确认交易的可测量 handoff，而不是广告曝光。','Partner chain：onboarding → availability → handoff → provider confirmation → attribution → revenue ledger → settlement。','合作伙伴为什么愿意集成并付费？','因为他们获得合格需求和有证据支持的 attribution；willingness-to-pay 与 unit economics 必须由试点证明。','下一步说明商业化如何不破坏城市服务信任。','ecosystem'],
  ['demand-marketplace','可以商业化需求，但不能出售 organic rank。','Organic ranking 使用 relevance、distance、time、availability、preference 和 service quality；sponsorship 单独存在。','会不会变成广告流？','不会让付费赞助改变 organic shortlist；商业库存与游客效用分离。','下一步从单个 offer 转向区域未满足需求。','operations'],
  ['district-opportunity','持续 unmet demand 只是可验证的区域机会，不等于投资决策。','Demand Control Tower → acquisition brief → partner shortlist → post-onboarding measurement → gap closed / still open。','未满足需求是不是意味着要新建项目？','不是。Gap 触发诊断，答案可能是 supply、营业时间、provider reliability、路线，甚至 no action。','下一步比较投入资本前的不同 intervention scenario。','operations'],
  ['digital-twin','Digital Twin 用来比较场景和测量模型误差，而不是假装准确预测未来。','Baseline → intervention → expected delta → post-launch verification；没有 measured calibration 时 ACTUAL 被阻止。','为什么要相信模拟？','不应无条件相信：forecast 有 confidence，启动后必须与 observed outcome 对比。','下一步比较预算约束下的多个 intervention。','operations'],
  ['capital-portfolio','预算受限时，系统生成 shortlist，但不会替城市分配公共资金。','Portfolio Optimizer 按 impact、confidence、risk、implementation time 和 capital efficiency 比较方案。','算法会决定城市钱怎么花吗？','不会：它只是 recommendation-only；investmentDecision=false，capital commitment 只能在 governance 后产生。','下一步展示 recommendation 如何进入委员会正式决策。','operations'],
  ['committee-governance','只有 owners、evidence、procurement path 和 approvals 完整后，recommendation 才能成为 committed capital。','Investment Committee Workspace：business case → sponsor/owner → budget source → evidence package → approval stages → commitment。','系统会自己选择采购程序吗？','不会。它要求 confirmed procurement path 和 authority reference，但不替代法律决策。','下一步展示 approval 后整个 programme 如何被管理。','operations'],
  ['programme-control','approval 之后，authorized、committed、actual 和真正 available 的资本必须分开显示。','Capital Programme Control Tower 展示 execution、benefits、underperformance 和 reallocation opportunities，但没有 auto-reallocation。','钱没花掉，为什么不能马上挪用？','因为 committed-but-unspent 不是 available：必须先 formal review/decommitment，再做新的 funding decision。','下一步展示 programme outcome 如何反过来改变模型 confidence。','operations'],
  ['learning-model-risk','系统必须从错误中学习，但无权自行修改 production model。','Forecast error → segment confidence → calibration proposal → holdout → acceptance → version → explicit activation。','自学习会不会自行改规则？','不会：auto-activation、auto-promotion、auto-rollback 都被禁止，新版本必须通过 model-risk governance。','最后证明整个决策历史都可以被复现。','operations'],
  ['audit-decision','一年后，城市仍应能证明为什么当时这样决策、实际发生了什么、系统学到了什么。','Audit Ledger 连接 data snapshot、model/policy version、scenario、approvals、capital、execution、outcome、learning 与 model change。','hash-chain 是区块链吗？为什么需要？','不是。它是 append-only integrity mechanism，用于发现历史重写并支持 reproducible decision replay。','转向会议唯一决策：同意瓦尔瓦尔卡 — 扎里亚季耶证据型试点。','acceptance']
].map((row,index) => ({
  stepId: row[0] as string,
  durationSeconds: durations[index]!,
  thesis: row[1] as string,
  proof: row[2] as string,
  objection: row[3] as string,
  answer: row[4] as string,
  next: row[5] as string,
  proofDestination: row[6] as GovernmentOwnerRouteDestination
}));

export function getExecutiveCompressedSteps(language: AppLanguage) {
  if (language === 'en') return en;
  if (language === 'zh') return zh;
  return ru;
}

export function executiveCompressedDurationSeconds() {
  return durations.reduce((sum, value) => sum + value, 0);
}

export function validateExecutiveCompression() {
  const steps = ru;
  return {
    stepCount: steps.length,
    durationSeconds: executiveCompressedDurationSeconds(),
    inTargetWindow:
      executiveCompressedDurationSeconds() >= 600
      && executiveCompressedDurationSeconds() <= 720,
    allHaveSingleSpine: steps.every(
      (step) =>
        step.thesis.trim().length > 0
        && step.proof.trim().length > 0
        && step.objection.trim().length > 0
        && step.answer.trim().length > 0
        && step.next.trim().length > 0
    )
  };
}
