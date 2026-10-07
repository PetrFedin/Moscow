import type { AppLanguage } from '../i18n';
import type { PilotDecisionBlocker } from './pilotInvestmentDecision';
import type {
  PilotContractSectionId,
  PilotDeliveryObligation,
  PilotPaymentMilestoneId,
  PilotResponsibilityRole
} from './pilotContractAuthority';

export type PilotContractSectionCopy = {
  id: PilotContractSectionId;
  title: string;
  summary: string;
  items: string[];
};

export type PilotContractCopy = {
  kicker: string;
  title: string;
  body: string;
  statusLabel: string;
  sections: PilotContractSectionCopy[];
  legalBoundaryTitle: string;
  legalBoundaryBody: string;
  focused: {
    kicker: string;
    blockerLabel: string;
    responsibleLabel: string;
    evidenceLabel: string;
    acceptanceLabel: string;
    paymentLabel: string;
    openClauseLabel: string;
  };
};

const copies: Record<AppLanguage, PilotContractCopy> = {
  ru: {
    kicker: 'PILOT CONTRACT BUILDER',
    title: 'Конструктор предмета пилотного договора',
    body: 'Scope → Deliverables → Responsibility Matrix → Acceptance → Payment Milestones → Handover. Каждая договорная обязанность привязывается к проверяемому evidence.',
    statusLabel: 'DRAFT STRUCTURE · НЕ ДОГОВОР',
    sections: [
      {
        id: 'scope',
        title: 'Scope',
        summary: 'Что именно входит в ограниченный пилот и не может расширяться молча.',
        items: [
          'Территория: Варварка — Зарядье; 5 точек маршрута; 2 spatial hero objects.',
          'Traveler flow: план дня → маршрут → исторический experience → фиксация посещения.',
          '20–50 supervised sessions и aggregate-only итог.',
          'Один согласованный provider/integration contour или формальный handoff.',
          'Отдельно фиксируется перечень того, что не входит в первый пилот.'
        ]
      },
      {
        id: 'deliverables',
        title: 'Deliverables',
        summary: 'Поставляемый результат описывается как набор принимаемых активов, а не как обещание “разработать приложение”.',
        items: [
          'Публичный туристический клиент.',
          'Versioned district / destination package.',
          'City Heritage Studio.',
          'City Journey Control Center.',
          'Integration contracts / adapters в согласованном scope.',
          'Pilot evidence pack и measured economics pack.'
        ]
      },
      {
        id: 'responsibility',
        title: 'Ответственность',
        summary: 'Для каждого внешнего gate назначается роль, которая обязана дать доступ, данные, review или исполнение.',
        items: [
          'Исполнитель: software, production pipeline, evidence packaging и техническая документация.',
          'Профильный владелец города: предмет задачи, решения по scope и организационная эскалация.',
          'Heritage/content authority: источники, права, исторический review и разрешение на публикацию.',
          'Integration/data owner: формальный provider/data access и integration acceptance.',
          'Pilot operator: организация supervised sessions и процедурная целостность пилота.',
          'Совместные governance review не объявляются односторонне закрытыми.'
        ]
      },
      {
        id: 'acceptance',
        title: 'Приёмка',
        summary: 'Приёмка происходит по evidence, а не по внешнему виду demo.',
        items: [
          'Software/client acceptance — воспроизводимый build и заявленный traveler flow.',
          'Romanov — реальный physical field proof.',
          'Old English Court — доказанная repeatability второго объекта.',
          'Visitor pilot — реальные сессии и формальный итоговый отчёт.',
          'Provider/integration — authority/handoff и проверяемая граница truth.',
          'Каждый acceptance clause имеет идентификатор и evidence reference.'
        ]
      },
      {
        id: 'payments',
        title: 'Порядок оплат',
        summary: 'Milestones описывают момент допустимой приёмки результата; суммы и проценты задаются только реальным договором.',
        items: [
          'Mobilization — только если предусмотрена договором; аванс не задаётся продуктом.',
          'Software acceptance — после принятия согласованного software/deliverables contour.',
          'Pilot evidence acceptance — после принятия physical / repeatability / visitor / provider evidence.',
          'Handover acceptance — после передачи согласованного IP/rights/operations пакета.',
          'Scale pack acceptance — после measured economics и decision-ready пакета.',
          'Размеры долей и суммы определяются только договором; приложение их не выдумывает.'
        ]
      },
      {
        id: 'handover',
        title: 'Handover',
        summary: 'Заранее фиксируется, что передаётся городу, что остаётся reusable platform IP и какие third-party ограничения сохраняются.',
        items: [
          'Код/build/deployment documentation в согласованном объёме.',
          'City-specific destination / heritage packages и evidence registry.',
          'Architecture, integration, security/data-flow и operations documentation.',
          'IP / rights / source-material handover matrix.',
          'Third-party assets и лицензии передаются только в пределах фактических прав.',
          'Операционная модель и SLA оформляются отдельно от исторической truth authority.'
        ]
      }
    ],
    legalBoundaryTitle: 'ЮРИДИЧЕСКАЯ ГРАНИЦА',
    legalBoundaryBody: 'Этот экран не является подписанным договором, офертой, закупочной документацией или юридическим заключением. Заказчик, правовая форма, цена, НДС, проценты оплат, реквизиты, сроки и обязательные нормы определяются только в реальных договорных документах.',
    focused: {
      kicker: 'BLOCKER → CONTRACT',
      blockerLabel: 'РИСК / BLOCKER',
      responsibleLabel: 'ОТВЕТСТВЕННАЯ РОЛЬ',
      evidenceLabel: 'ТРЕБУЕМОЕ EVIDENCE',
      acceptanceLabel: 'ПУНКТ ПРИЁМКИ',
      paymentLabel: 'PAYMENT MILESTONE',
      openClauseLabel: 'Открыть связанный раздел'
    }
  },
  en: {
    kicker: 'PILOT CONTRACT BUILDER',
    title: 'Pilot contract structure builder',
    body: 'Scope → Deliverables → Responsibility Matrix → Acceptance → Payment Milestones → Handover. Every obligation is tied to inspectable evidence.',
    statusLabel: 'DRAFT STRUCTURE · NOT A CONTRACT',
    sections: [
      {
        id: 'scope',
        title: 'Scope',
        summary: 'Defines the bounded pilot and prevents silent scope expansion.',
        items: [
          'Territory: Varvarka — Zaryadye; 5 route points; 2 spatial hero objects.',
          'Traveler flow: day plan → route → historical experience → visit confirmation.',
          '20–50 supervised sessions with aggregate-only reporting.',
          'One agreed provider/integration contour or formal handoff.',
          'Explicit exclusions are part of the first-pilot scope.'
        ]
      },
      {
        id: 'deliverables',
        title: 'Deliverables',
        summary: 'The subject is an accepted asset set, not a vague promise to “build an app”.',
        items: [
          'Public visitor client.',
          'Versioned district / destination package.',
          'City Heritage Studio.',
          'City Journey Control Center.',
          'Integration contracts / adapters within agreed scope.',
          'Pilot evidence pack and measured economics pack.'
        ]
      },
      {
        id: 'responsibility',
        title: 'Responsibility',
        summary: 'Every external gate has a role accountable for access, data, review or execution.',
        items: [
          'Contractor: software, production pipeline, evidence packaging and technical documentation.',
          'City business owner: problem statement, scope decisions and organisational escalation.',
          'Heritage/content authority: sources, rights, historical review and publication clearance.',
          'Integration/data owner: formal provider/data access and integration acceptance.',
          'Pilot operator: supervised sessions and procedural integrity.',
          'Joint governance reviews cannot be closed unilaterally.'
        ]
      },
      {
        id: 'acceptance',
        title: 'Acceptance',
        summary: 'Acceptance is evidence-based, not demo-appearance-based.',
        items: [
          'Software/client acceptance — reproducible build and declared traveler flow.',
          'Romanov — real physical field proof.',
          'Old English Court — second-object repeatability proof.',
          'Visitor pilot — real sessions and formal final report.',
          'Provider/integration — authority/handoff and inspectable truth boundary.',
          'Every acceptance clause has an ID and evidence reference.'
        ]
      },
      {
        id: 'payments',
        title: 'Payment milestones',
        summary: 'Milestones define when an outcome may be accepted; amounts and percentages exist only in the real contract.',
        items: [
          'Mobilization — only if the contract provides for it; no advance is invented by the product.',
          'Software acceptance — after the agreed software/deliverables contour is accepted.',
          'Pilot evidence acceptance — after physical / repeatability / visitor / provider evidence is accepted.',
          'Handover acceptance — after agreed IP/rights/operations transfer.',
          'Scale pack acceptance — after measured economics and a decision-ready pack.',
          'Payment shares and amounts are defined only by the contract.'
        ]
      },
      {
        id: 'handover',
        title: 'Handover',
        summary: 'Separates city deliverables, reusable platform IP and third-party restrictions before signature.',
        items: [
          'Code/build/deployment documentation within agreed scope.',
          'City-specific destination / heritage packages and evidence registry.',
          'Architecture, integration, security/data-flow and operations documentation.',
          'IP / rights / source-material handover matrix.',
          'Third-party assets transfer only within actual rights.',
          'Operations/SLA remain separate from historical truth authority.'
        ]
      }
    ],
    legalBoundaryTitle: 'LEGAL BOUNDARY',
    legalBoundaryBody: 'This screen is not a signed contract, offer, procurement document or legal opinion. Customer identity, legal form, price, taxes, payment percentages, details, dates and mandatory clauses must be set in actual contractual documents.',
    focused: {
      kicker: 'BLOCKER → CONTRACT',
      blockerLabel: 'RISK / BLOCKER',
      responsibleLabel: 'RESPONSIBLE ROLE',
      evidenceLabel: 'REQUIRED EVIDENCE',
      acceptanceLabel: 'ACCEPTANCE CLAUSE',
      paymentLabel: 'PAYMENT MILESTONE',
      openClauseLabel: 'Open linked section'
    }
  },
  zh: {
    kicker: 'PILOT CONTRACT BUILDER',
    title: '试点合同结构构建器',
    body: '范围 → 交付成果 → 责任矩阵 → 验收 → 付款里程碑 → 交接。每项义务都必须绑定可检查的证据。',
    statusLabel: '草案结构 · 非正式合同',
    sections: [
      {
        id: 'scope',
        title: '范围',
        summary: '明确有限试点边界，避免范围被默认扩大。',
        items: [
          '区域：瓦尔瓦尔卡 — 扎里亚季耶；5 个路线点；2 个空间核心对象。',
          '游客流程：日计划 → 路线 → 历史体验 → 到访确认。',
          '20–50 次受监督体验，仅输出汇总报告。',
          '一个经确认的服务商/集成链路或正式交接方案。',
          '首个试点不包含的内容也必须明确记录。'
        ]
      },
      {
        id: 'deliverables',
        title: '交付成果',
        summary: '合同标的是可验收资产集合，而不是模糊的“开发一个应用”。',
        items: [
          '公共游客客户端。',
          '版本化区域 / destination package。',
          'City Heritage Studio。',
          'City Journey Control Center。',
          '约定范围内的集成契约 / adapters。',
          '试点证据包与实测经济性材料。'
        ]
      },
      {
        id: 'responsibility',
        title: '责任矩阵',
        summary: '每个外部关卡都必须有负责访问、数据、审核或执行的角色。',
        items: [
          '承包方：软件、生产流程、证据打包和技术文档。',
          '城市业务负责人：问题定义、范围决策和组织升级。',
          '文化遗产/内容权威：来源、权利、历史审核和发布许可。',
          '集成/数据负责人：正式服务商/数据访问和集成验收。',
          '试点运营方：受监督体验及程序完整性。',
          '联合治理审核不能由单方宣布完成。'
        ]
      },
      {
        id: 'acceptance',
        title: '验收',
        summary: '按证据验收，而不是按演示效果验收。',
        items: [
          '软件/客户端验收 — 可重复构建以及声明的游客流程。',
          'Romanov — 真实现场验证。',
          'Old English Court — 第二对象可复制性证明。',
          '游客试点 — 真实体验和正式最终报告。',
          '服务商/集成 — authority/handoff 与可检查的事实边界。',
          '每个验收条款都有 ID 与 evidence reference。'
        ]
      },
      {
        id: 'payments',
        title: '付款里程碑',
        summary: '里程碑只定义何时可以验收成果；金额和比例仅由真实合同确定。',
        items: [
          'Mobilization — 仅在合同约定时适用；产品不虚构预付款。',
          'Software acceptance — 约定的软件/交付范围验收后。',
          'Pilot evidence acceptance — 现场/可复制性/游客/服务商证据验收后。',
          'Handover acceptance — 约定的 IP/权利/运营材料交接后。',
          'Scale pack acceptance — 实测经济性和决策材料完成后。',
          '付款比例和金额只能由合同确定。'
        ]
      },
      {
        id: 'handover',
        title: '交接',
        summary: '签署前区分城市交付成果、可复用平台 IP 与第三方限制。',
        items: [
          '约定范围内的代码/build/deployment 文档。',
          '城市专属 destination / heritage packages 与证据登记。',
          '架构、集成、安全/数据流和运营文档。',
          'IP / rights / source-material 交接矩阵。',
          '第三方资产仅在实际权利范围内交接。',
          '运营/SLA 与历史事实权威分开管理。'
        ]
      }
    ],
    legalBoundaryTitle: '法律边界',
    legalBoundaryBody: '本界面不是已签署合同、要约、采购文件或法律意见。客户主体、法律形式、价格、税费、付款比例、账户信息、日期和强制条款必须在真实合同文件中确定。',
    focused: {
      kicker: 'BLOCKER → CONTRACT',
      blockerLabel: '风险 / 阻塞项',
      responsibleLabel: '责任角色',
      evidenceLabel: '所需证据',
      acceptanceLabel: '验收条款',
      paymentLabel: '付款里程碑',
      openClauseLabel: '打开关联章节'
    }
  }
};

const blockerCopy: Record<PilotDecisionBlocker, Record<AppLanguage, string>> = {
  'romanov-field-proof-missing': { ru: 'Romanov: нет реального field proof', en: 'Romanov: real field proof missing', zh: 'Romanov：缺少真实现场验证' },
  'second-object-repeatability-missing': { ru: 'Второй объект: repeatability не доказана', en: 'Second object: repeatability not proven', zh: '第二对象：可复制性尚未证明' },
  'visitor-pilot-review-missing': { ru: 'Visitor pilot: нет итогового review', en: 'Visitor pilot: final review missing', zh: '游客试点：缺少最终审核' },
  'live-provider-agreement-missing': { ru: 'Provider: нет формального authority/handoff', en: 'Provider: formal authority/handoff missing', zh: '服务商：缺少正式 authority/handoff' },
  'publication-rights-blockers-remain': { ru: 'Права: остаются publication blockers', en: 'Rights: publication blockers remain', zh: '权利：仍有发布阻塞项' },
  'security-data-flow-review-missing': { ru: 'Security/data-flow review не завершён', en: 'Security/data-flow review missing', zh: '安全/数据流审核未完成' },
  'ip-handover-review-missing': { ru: 'IP/handover review не согласован', en: 'IP/handover review missing', zh: 'IP/交接审核未完成' },
  'operations-sla-review-missing': { ru: 'Operations/SLA review не согласован', en: 'Operations/SLA review missing', zh: '运营/SLA 审核未完成' },
  'next-object-cost-unmeasured': { ru: 'Не измерена стоимость следующего объекта', en: 'Next-object cost not measured', zh: '下一个对象成本尚未测量' },
  'next-object-production-time-unmeasured': { ru: 'Не измерен lead time следующего объекта', en: 'Next-object lead time not measured', zh: '下一个对象周期尚未测量' },
  'developer-hours-unmeasured': { ru: 'Не измерены developer hours / object', en: 'Developer hours / object not measured', zh: '单对象开发工时尚未测量' },
  'institution-operator-hours-unmeasured': { ru: 'Не измерены institution hours / object', en: 'Institution hours / object not measured', zh: '单对象机构工时尚未测量' },
  'district-shared-setup-cost-unmeasured': { ru: 'Не измерен shared setup района', en: 'District shared setup cost not measured', zh: '区域共享初始化成本尚未测量' },
  'district-integration-cost-unmeasured': { ru: 'Не измерена интеграция района', en: 'District integration cost not measured', zh: '区域集成成本尚未测量' },
  'annual-operations-cost-unmeasured': { ru: 'Не измерена годовая эксплуатация', en: 'Annual operations cost not measured', zh: '年度运营成本尚未测量' }
};

const roleCopy: Record<PilotResponsibilityRole, Record<AppLanguage, string>> = {
  contractor: { ru: 'Исполнитель', en: 'Contractor', zh: '承包方' },
  'city-business-owner': { ru: 'Профильный владелец задачи', en: 'City business owner', zh: '城市业务负责人' },
  'heritage-authority': { ru: 'Heritage / content authority', en: 'Heritage / content authority', zh: '文化遗产 / 内容权威' },
  'integration-data-owner': { ru: 'Integration / data owner', en: 'Integration / data owner', zh: '集成 / 数据负责人' },
  'pilot-operator': { ru: 'Оператор пилота', en: 'Pilot operator', zh: '试点运营方' },
  'joint-governance': { ru: 'Совместно: город + исполнитель', en: 'Joint: city + contractor', zh: '联合：城市 + 承包方' },
  'city-operations-owner': { ru: 'Городской operations owner + исполнитель', en: 'City operations owner + contractor', zh: '城市运营负责人 + 承包方' }
};

const milestoneCopy: Record<PilotPaymentMilestoneId, Record<AppLanguage, string>> = {
  mobilization: { ru: 'Mobilization · только если предусмотрено договором', en: 'Mobilization · only if contracted', zh: '启动款 · 仅合同约定时适用' },
  'software-acceptance': { ru: 'Milestone · принят software contour', en: 'Milestone · software contour accepted', zh: '里程碑 · 软件范围验收' },
  'pilot-evidence-acceptance': { ru: 'Milestone · принят pilot evidence pack', en: 'Milestone · pilot evidence pack accepted', zh: '里程碑 · 试点证据包验收' },
  'handover-acceptance': { ru: 'Milestone · принят handover package', en: 'Milestone · handover package accepted', zh: '里程碑 · 交接包验收' },
  'scale-pack-acceptance': { ru: 'Milestone · принят measured scale pack', en: 'Milestone · measured scale pack accepted', zh: '里程碑 · 实测规模化材料验收' }
};

export function getPilotContractCopy(language: AppLanguage) {
  return copies[language];
}

export function getPilotObligationCopy(
  language: AppLanguage,
  obligation: PilotDeliveryObligation
) {
  return {
    blocker: blockerCopy[obligation.blocker][language],
    responsible: roleCopy[obligation.responsibleRole][language],
    evidence: obligation.evidenceCode,
    acceptanceClause: obligation.acceptanceClauseId,
    paymentMilestone: milestoneCopy[obligation.paymentMilestone][language]
  };
}

export function getPilotBlockerLabel(language: AppLanguage, blocker: PilotDecisionBlocker) {
  return blockerCopy[blocker][language];
}
