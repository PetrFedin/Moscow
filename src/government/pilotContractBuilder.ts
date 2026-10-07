import type { AppLanguage } from '../i18n';
import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness,
  type PilotInvestmentEvidence
} from './pilotInvestmentDecision';

export type ContractResponsibility = {
  workstream: string;
  productTeam: string;
  city: string;
  acceptanceOwner: string;
};

export type ContractMilestone = {
  id: string;
  title: string;
  trigger: string;
  acceptance: string;
  payment: string;
};

export type PilotContractBuilderModel = {
  title: string;
  subtitle: string;
  status: string;
  statusNote: string;
  labels: {
    scope: string;
    deliverables: string;
    responsibility: string;
    acceptance: string;
    payment: string;
    handover: string;
    openTerms: string;
    productTeam: string;
    city: string;
    acceptanceOwner: string;
    trigger: string;
    paymentTerm: string;
  };
  scope: string[];
  deliverables: string[];
  responsibilities: ContractResponsibility[];
  acceptance: Array<{ title: string; state: 'passed' | 'blocked'; evidence: string }>;
  milestones: ContractMilestone[];
  handover: string[];
  openTerms: string[];
};

const copy = {
  ru: {
    title: 'Pilot Contract Builder',
    subtitle: 'Структура предмета договора: от ограниченного scope до приёмки, оплаты и формального handover.',
    statusReady: 'СТРУКТУРА ГОТОВА · КОММЕРЧЕСКИЕ УСЛОВИЯ ТРЕБУЮТ СОГЛАСОВАНИЯ',
    statusNote: 'Экран не подменяет юридический договор: цена, график, закупочный механизм и обязательные правовые условия должны быть согласованы сторонами.',
    labels: {
      scope: '01 · SCOPE',
      deliverables: '02 · DELIVERABLES',
      responsibility: '03 · RESPONSIBILITY MATRIX',
      acceptance: '04 · ACCEPTANCE',
      payment: '05 · PAYMENT MILESTONES',
      handover: '06 · HANDOVER',
      openTerms: 'ОТКРЫТЫЕ УСЛОВИЯ ДО ПОДПИСАНИЯ',
      productTeam: 'КОМАНДА ПРОДУКТА',
      city: 'МОСКВА / ПЛОЩАДКА',
      acceptanceOwner: 'ВЛАДЕЛЕЦ ПРИЁМКИ',
      trigger: 'ТРИГГЕР',
      paymentTerm: 'ОПЛАТА'
    },
    scope: [
      'Пилотная территория: Варварка — Зарядье.',
      '5 точек туристического маршрута.',
      '2 spatial hero objects: Палаты Романовых + Старый Английский двор.',
      'Reference client: iOS / Android / web.',
      'Путь туриста: план поездки → Today → маршрут → исторический experience → фиксация посещения.',
      '20–50 supervised pilot sessions с aggregate-only отчётом.',
      'Один согласованный provider / city-data integration contour либо формальный integration handoff.',
      'Измерение фактической себестоимости, lead time и трудозатрат следующего verified object.'
    ],
    deliverables: [
      'Публичный туристический клиент.',
      'Versioned destination package пилотной территории.',
      'City Heritage Studio workflow.',
      'City Journey Control Center.',
      'Integration contracts / provider boundaries.',
      'Field + visitor + acceptance evidence pack.',
      'Production economics следующего объекта.',
      'Final pilot report + scale Go / No-Go memo.'
    ],
    responsibilities: [
      {
        workstream: 'Продукт и software',
        productTeam: 'Код, сборки, UX, contract tests, release evidence.',
        city: 'Назначить технический контакт и согласовать целевой контур распространения.',
        acceptanceOwner: 'Технический владелец пилота.'
      },
      {
        workstream: 'Исторический контент и права',
        productTeam: 'Source/rights/claim workflow, versioning, provenance.',
        city: 'Доступ к экспертам/учреждениям и подтверждение разрешённых источников/прав в согласованной зоне ответственности.',
        acceptanceOwner: 'Heritage/content authority.'
      },
      {
        workstream: 'Field verification',
        productTeam: 'Методика, build, evidence capture и отчёт.',
        city: 'Доступ к площадке, согласованный режим полевого тестирования и контакт площадки.',
        acceptanceOwner: 'Владелец площадки + технический reviewer.'
      },
      {
        workstream: 'Visitor pilot',
        productTeam: 'Сценарий, privacy-safe instrumentation, aggregate report.',
        city: 'Организационный доступ к согласованной аудитории/площадке, если это входит в модель пилота.',
        acceptanceOwner: 'Профильный владелец туристического journey.'
      },
      {
        workstream: 'Интеграции',
        productTeam: 'Adapter boundary, validation, freshness/evidence logic.',
        city: 'Integration/data owner, разрешённый API/feed/sandbox или формальный handoff.',
        acceptanceOwner: 'Integration/data owner.'
      },
      {
        workstream: 'Приёмка и handover',
        productTeam: 'Evidence bundle, документация, handover package, итоговый отчёт.',
        city: 'Консолидированное решение по acceptance и перечню замечаний.',
        acceptanceOwner: 'Назначенный owner договора / пилота.'
      }
    ],
    acceptanceEvidence: {
      romanov: ['Палаты Романовых · physical field proof', 'Реальный field evidence должен пройти gate.'],
      oec: ['Старый Английский двор · repeatability', 'Второй объект должен пройти generic pipeline без Romanov-specific исключений.'],
      visitor: ['Visitor pilot', 'Реальные supervised sessions и формальный итоговый отчёт.'],
      provider: ['Live/provider integration', 'Provider authority либо согласованный integration handoff должен быть документирован.'],
      governance: ['Governance', 'Права, security/data-flow, IP/handover и operations/SLA должны быть согласованы.'],
      economics: ['Production economics', 'Все обязательные cost inputs должны иметь basis и evidence reference.']
    },
    milestones: [
      {
        id: 'm1',
        title: 'M1 · Contract start / baseline',
        trigger: 'Подписанный scope, назначенные owners, перечень доступов/зависимостей и согласованная acceptance matrix.',
        acceptance: 'Baseline зафиксирован; внешние зависимости и зоны ответственности отмечены явно.',
        payment: 'Сумма или доля платежа определяется договором; в MVP не подставляется автоматически.'
      },
      {
        id: 'm2',
        title: 'M2 · Functional pilot package',
        trigger: 'Рабочий reference client + pilot destination package + Studio/Control Center + техническая документация.',
        acceptance: 'Функциональная приёмка по согласованному build и contract tests; это ещё не field proof.',
        payment: 'Сумма или доля платежа определяется договором после согласования коммерческих условий.'
      },
      {
        id: 'm3',
        title: 'M3 · Evidence execution',
        trigger: 'Выполнены доступные по ответственности сторон field / second-object / visitor / integration evidence activities.',
        acceptance: 'Каждый gate имеет PASS либо формально зафиксированный blocker/dependency; blocker не маскируется под PASS.',
        payment: 'Условие оплаты должно учитывать зависимости, которые находятся на стороне города/третьих провайдеров.'
      },
      {
        id: 'm4',
        title: 'M4 · Final acceptance / handover',
        trigger: 'Передан итоговый evidence pack, final pilot report, handover package и measured economics.',
        acceptance: 'Подписанная или иным согласованным способом оформленная итоговая приёмка по договору.',
        payment: 'Финальный платёж/удержание определяется договором; автоматический процент не задаётся продуктом.'
      }
    ],
    handover: [
      'Исходный код / build artifacts в объёме, установленном IP-моделью договора.',
      'Destination package и версии опубликованных/пилотных данных.',
      'Source / rights / claim / publication registry в согласованном объёме.',
      'Integration contracts, adapter documentation и список внешних зависимостей.',
      'Security/data-flow и operations/SLA материалы.',
      'Field / visitor / provider evidence archive и итоговый отчёт.',
      'Measured cost basis и расчётная модель следующего района.',
      'IP / rights / third-party dependency matrix.'
    ],
    openTerms: [
      'Юридическое лицо заказчика и исполнителя.',
      'Правовая/закупочная форма пилота.',
      'Цена договора, НДС/налоговый режим и валюта расчётов.',
      'Календарный график и правила изменения сроков при внешних зависимостях.',
      'Размер и распределение платежей по milestones.',
      'IP: лицензия / отчуждение / права на city-specific assets / reusable platform IP.',
      'Конфиденциальность, персональные данные и информационная безопасность.',
      'Гарантия, ответственность, termination и dispute-resolution условия.',
      'Production hosting, SLA и эксплуатационная модель после пилота.'
    ]
  },
  en: {
    title: 'Pilot Contract Builder',
    subtitle: 'Procurement structure from bounded scope through acceptance, payment milestones and formal handover.',
    statusReady: 'STRUCTURE READY · COMMERCIAL TERMS REQUIRE AGREEMENT',
    statusNote: 'This screen does not replace a legal agreement. Price, schedule, procurement mechanism and mandatory legal terms must be agreed by the parties.',
    labels: {
      scope: '01 · SCOPE',
      deliverables: '02 · DELIVERABLES',
      responsibility: '03 · RESPONSIBILITY MATRIX',
      acceptance: '04 · ACCEPTANCE',
      payment: '05 · PAYMENT MILESTONES',
      handover: '06 · HANDOVER',
      openTerms: 'OPEN TERMS BEFORE SIGNATURE',
      productTeam: 'PRODUCT TEAM',
      city: 'MOSCOW / PILOT SITE',
      acceptanceOwner: 'ACCEPTANCE OWNER',
      trigger: 'TRIGGER',
      paymentTerm: 'PAYMENT'
    },
    scope: [
      'Pilot territory: Varvarka — Zaryadye.',
      '5 visitor-route points.',
      '2 spatial hero objects: Romanov Chambers + Old English Court.',
      'Reference client: iOS / Android / web.',
      'Traveler flow: trip plan → Today → route → historical experience → visit confirmation.',
      '20–50 supervised pilot sessions with an aggregate-only report.',
      'One agreed provider / city-data integration contour or a formal integration handoff.',
      'Measurement of actual cost, lead time and labour for the next verified object.'
    ],
    deliverables: [
      'Public visitor client.',
      'Versioned destination package for the pilot territory.',
      'City Heritage Studio workflow.',
      'City Journey Control Center.',
      'Integration contracts / provider boundaries.',
      'Field + visitor + acceptance evidence pack.',
      'Production economics for the next object.',
      'Final pilot report + scale Go / No-Go memo.'
    ],
    responsibilities: [
      {
        workstream: 'Product and software',
        productTeam: 'Code, builds, UX, contract tests and release evidence.',
        city: 'Name a technical contact and agree the target distribution contour.',
        acceptanceOwner: 'Pilot technical owner.'
      },
      {
        workstream: 'Historical content and rights',
        productTeam: 'Source/rights/claim workflow, versioning and provenance.',
        city: 'Provide access to experts/institutions and confirm permitted sources/rights within the agreed responsibility boundary.',
        acceptanceOwner: 'Heritage/content authority.'
      },
      {
        workstream: 'Field verification',
        productTeam: 'Methodology, build, evidence capture and report.',
        city: 'Provide site access, agreed field-testing regime and a site contact.',
        acceptanceOwner: 'Site owner + technical reviewer.'
      },
      {
        workstream: 'Visitor pilot',
        productTeam: 'Protocol, privacy-safe instrumentation and aggregate report.',
        city: 'Provide organisational access to the agreed audience/site when included in the pilot model.',
        acceptanceOwner: 'Visitor-journey business owner.'
      },
      {
        workstream: 'Integrations',
        productTeam: 'Adapter boundary, validation and freshness/evidence logic.',
        city: 'Provide integration/data owner and permitted API/feed/sandbox or formal handoff.',
        acceptanceOwner: 'Integration/data owner.'
      },
      {
        workstream: 'Acceptance and handover',
        productTeam: 'Evidence bundle, documentation, handover package and final report.',
        city: 'Provide consolidated acceptance decision and issue list.',
        acceptanceOwner: 'Named contract / pilot owner.'
      }
    ],
    acceptanceEvidence: {
      romanov: ['Romanov Chambers · physical field proof', 'Real field evidence must pass the gate.'],
      oec: ['Old English Court · repeatability', 'The second object must pass the generic pipeline without Romanov-specific exceptions.'],
      visitor: ['Visitor pilot', 'Real supervised sessions and a formal final report.'],
      provider: ['Live/provider integration', 'Provider authority or the agreed integration handoff must be documented.'],
      governance: ['Governance', 'Rights, security/data-flow, IP/handover and operations/SLA must be agreed.'],
      economics: ['Production economics', 'All mandatory cost inputs must have a basis and evidence reference.']
    },
    milestones: [
      {
        id: 'm1',
        title: 'M1 · Contract start / baseline',
        trigger: 'Signed scope, named owners, dependency/access list and agreed acceptance matrix.',
        acceptance: 'Baseline is fixed; external dependencies and responsibility boundaries are explicit.',
        payment: 'Payment amount or share is defined in the contract and is not auto-filled by the MVP.'
      },
      {
        id: 'm2',
        title: 'M2 · Functional pilot package',
        trigger: 'Working reference client + pilot destination package + Studio/Control Center + technical documentation.',
        acceptance: 'Functional acceptance against the agreed build and contract tests; this is not yet field proof.',
        payment: 'Payment amount or share is defined after commercial terms are agreed.'
      },
      {
        id: 'm3',
        title: 'M3 · Evidence execution',
        trigger: 'Field / second-object / visitor / integration evidence activities available under the parties’ responsibilities are executed.',
        acceptance: 'Each gate has a PASS or a formally recorded blocker/dependency; blockers are never presented as PASS.',
        payment: 'The payment condition must account for dependencies controlled by the city or third-party providers.'
      },
      {
        id: 'm4',
        title: 'M4 · Final acceptance / handover',
        trigger: 'Final evidence pack, pilot report, handover package and measured economics are delivered.',
        acceptance: 'Final acceptance is executed in the form agreed by the contract.',
        payment: 'Final payment/retention is defined by the contract; the product does not invent a percentage.'
      }
    ],
    handover: [
      'Source code / build artifacts to the extent defined by the contract IP model.',
      'Destination package and versions of published/pilot data.',
      'Source / rights / claim / publication registry within the agreed scope.',
      'Integration contracts, adapter documentation and external dependency list.',
      'Security/data-flow and operations/SLA materials.',
      'Field / visitor / provider evidence archive and final report.',
      'Measured cost basis and next-district calculation model.',
      'IP / rights / third-party dependency matrix.'
    ],
    openTerms: [
      'Legal entities of customer and supplier.',
      'Legal/procurement form of the pilot.',
      'Contract price, tax/VAT treatment and settlement currency.',
      'Delivery schedule and rules for external-dependency delays.',
      'Payment amount and allocation across milestones.',
      'IP: licence / assignment / city-specific assets / reusable platform IP.',
      'Confidentiality, personal data and information security.',
      'Warranty, liability, termination and dispute-resolution terms.',
      'Production hosting, SLA and post-pilot operating model.'
    ]
  },
  zh: {
    title: '试点合同构建器',
    subtitle: '把有限试点范围转化为可采购结构：范围、交付、责任、验收、付款节点和正式交接。',
    statusReady: '结构已就绪 · 商业条款仍需双方协商',
    statusNote: '该界面不替代正式法律合同。价格、周期、采购机制及必要法律条款必须由双方另行确认。',
    labels: {
      scope: '01 · 范围',
      deliverables: '02 · 交付成果',
      responsibility: '03 · 责任矩阵',
      acceptance: '04 · 验收',
      payment: '05 · 付款节点',
      handover: '06 · 交接',
      openTerms: '签署前待确认条款',
      productTeam: '产品团队',
      city: '莫斯科 / 试点场地',
      acceptanceOwner: '验收负责人',
      trigger: '触发条件',
      paymentTerm: '付款'
    },
    scope: [
      '试点区域：瓦尔瓦尔卡 — 扎里亚季耶。',
      '5 个游客路线点。',
      '2 个核心空间对象：罗曼诺夫家族宅邸 + 老英国庭院。',
      'Reference client：iOS / Android / web。',
      '游客流程：行程计划 → Today → 路线 → 历史体验 → 到访确认。',
      '20–50 次受监督试点，仅输出汇总报告。',
      '一个双方确认的 provider / city-data 集成链路，或正式 integration handoff。',
      '测量下一个 verified object 的实际成本、周期和工时。'
    ],
    deliverables: [
      '公共游客客户端。',
      '试点区域的版本化 destination package。',
      'City Heritage Studio 工作流。',
      'City Journey Control Center。',
      'Integration contracts / provider boundaries。',
      '现场 + 游客 + 验收证据包。',
      '下一个对象的 production economics。',
      '最终试点报告 + 扩展 Go / No-Go 备忘录。'
    ],
    responsibilities: [
      {
        workstream: '产品与软件',
        productTeam: '代码、构建、UX、contract tests 与 release evidence。',
        city: '指定技术联系人并确认目标发布/分发环境。',
        acceptanceOwner: '试点技术负责人。'
      },
      {
        workstream: '历史内容与权利',
        productTeam: 'Source/rights/claim 工作流、版本与 provenance。',
        city: '在约定责任边界内提供专家/机构访问，并确认允许使用的来源与权利。',
        acceptanceOwner: '文化遗产/内容 authority。'
      },
      {
        workstream: '现场验证',
        productTeam: '方法、build、证据采集与报告。',
        city: '提供场地访问、确认现场测试机制及场地联系人。',
        acceptanceOwner: '场地负责人 + 技术 reviewer。'
      },
      {
        workstream: '游客试点',
        productTeam: '试点协议、隐私安全埋点和汇总报告。',
        city: '如果纳入试点模型，提供约定受众/场地的组织协调。',
        acceptanceOwner: '游客旅程业务负责人。'
      },
      {
        workstream: '集成',
        productTeam: 'Adapter boundary、验证及 freshness/evidence 逻辑。',
        city: '指定 integration/data owner，并提供许可 API/feed/sandbox 或正式 handoff。',
        acceptanceOwner: 'Integration/data owner。'
      },
      {
        workstream: '验收与交接',
        productTeam: 'Evidence bundle、文档、handover package 和最终报告。',
        city: '形成统一验收决定及问题清单。',
        acceptanceOwner: '指定合同 / 试点负责人。'
      }
    ],
    acceptanceEvidence: {
      romanov: ['罗曼诺夫家族宅邸 · 现场验证', '真实现场证据必须通过 gate。'],
      oec: ['老英国庭院 · 可复制性', '第二个独立对象必须通过 generic pipeline，不能依赖 Romanov-specific 例外。'],
      visitor: ['游客试点', '完成真实受监督体验并形成正式最终报告。'],
      provider: ['Live/provider 集成', '必须记录 provider authority 或双方确认的 integration handoff。'],
      governance: ['治理', '权利、安全/数据流、IP/handover 和 operations/SLA 必须得到确认。'],
      economics: ['生产经济性', '所有必需成本输入必须有 basis 和 evidence reference。']
    },
    milestones: [
      {
        id: 'm1',
        title: 'M1 · 合同启动 / 基线',
        trigger: '范围已签署、负责人已指定、访问/依赖清单及验收矩阵已确认。',
        acceptance: '基线固定；外部依赖及责任边界明确。',
        payment: '付款金额或比例由合同约定，MVP 不自动填入。'
      },
      {
        id: 'm2',
        title: 'M2 · 功能试点包',
        trigger: '可运行 reference client + pilot destination package + Studio/Control Center + 技术文档。',
        acceptance: '按照约定 build 与 contract tests 完成功能验收；这并不等于现场验证。',
        payment: '金额或比例在商业条款确认后写入合同。'
      },
      {
        id: 'm3',
        title: 'M3 · 证据执行',
        trigger: '在双方责任和可用条件下完成现场 / 第二对象 / 游客 / 集成证据活动。',
        acceptance: '每个 gate 都必须是 PASS 或正式记录 blocker/dependency；不得把 blocker 表示为 PASS。',
        payment: '付款条件必须考虑由城市或第三方 provider 控制的依赖。'
      },
      {
        id: 'm4',
        title: 'M4 · 最终验收 / 交接',
        trigger: '提交最终 evidence pack、试点报告、handover package 和 measured economics。',
        acceptance: '按合同约定形式完成最终验收。',
        payment: '最终付款/保留款由合同确定；产品不虚构百分比。'
      }
    ],
    handover: [
      '按合同 IP 模型约定范围交付源代码 / build artifacts。',
      'Destination package 及已发布/试点数据版本。',
      '约定范围内的 source / rights / claim / publication registry。',
      'Integration contracts、adapter 文档和外部依赖清单。',
      'Security/data-flow 与 operations/SLA 材料。',
      'Field / visitor / provider evidence archive 和最终报告。',
      'Measured cost basis 与下一地区计算模型。',
      'IP / rights / third-party dependency matrix。'
    ],
    openTerms: [
      '客户与供应方的法律主体。',
      '试点的法律/采购形式。',
      '合同价格、税/VAT 处理与结算币种。',
      '交付周期及外部依赖导致延期的规则。',
      '各 milestone 的付款金额与分配。',
      'IP：许可 / 转让 / 城市专属资产 / 可复用平台 IP。',
      '保密、个人数据与信息安全。',
      '保证、责任、终止和争议解决条款。',
      '生产托管、SLA 和试点后的运营模式。'
    ]
  }
} as const;

export function getPilotContractBuilderModel(
  language: AppLanguage,
  evidence: PilotInvestmentEvidence = currentPilotInvestmentEvidence
): PilotContractBuilderModel {
  const c = copy[language];
  const readiness = getPilotDecisionReadiness(evidence);

  const acceptance: PilotContractBuilderModel['acceptance'] = [
    {
      title: c.acceptanceEvidence.romanov[0],
      state: evidence.proof.romanovFieldVerified ? 'passed' : 'blocked',
      evidence: c.acceptanceEvidence.romanov[1]
    },
    {
      title: c.acceptanceEvidence.oec[0],
      state: evidence.proof.oldEnglishCourtRepeatabilityVerified ? 'passed' : 'blocked',
      evidence: c.acceptanceEvidence.oec[1]
    },
    {
      title: c.acceptanceEvidence.visitor[0],
      state: evidence.proof.visitorPilotReviewed ? 'passed' : 'blocked',
      evidence: c.acceptanceEvidence.visitor[1]
    },
    {
      title: c.acceptanceEvidence.provider[0],
      state: evidence.proof.liveProviderAgreementReady ? 'passed' : 'blocked',
      evidence: c.acceptanceEvidence.provider[1]
    },
    {
      title: c.acceptanceEvidence.governance[0],
      state: readiness.governanceReady ? 'passed' : 'blocked',
      evidence: c.acceptanceEvidence.governance[1]
    },
    {
      title: c.acceptanceEvidence.economics[0],
      state: readiness.economicsReady ? 'passed' : 'blocked',
      evidence: c.acceptanceEvidence.economics[1]
    }
  ];

  return {
    title: c.title,
    subtitle: c.subtitle,
    status: c.statusReady,
    statusNote: c.statusNote,
    labels: c.labels,
    scope: [...c.scope],
    deliverables: [...c.deliverables],
    responsibilities: c.responsibilities.map((item) => ({ ...item })),
    acceptance,
    milestones: c.milestones.map((item) => ({ ...item })),
    handover: [...c.handover],
    openTerms: [...c.openTerms]
  };
}
