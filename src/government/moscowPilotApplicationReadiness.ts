import {
  currentGovernmentDeliveryManifest,
  evaluateGovernmentDeliveryReadiness
} from './governmentDeliveryManifest.ts';

export const MOSCOW_PILOT_APPLICATION_VERSION = 1 as const;

export type MoscowPilotApplicationFieldStatus =
  | 'ready'
  | 'project-draft'
  | 'applicant-input-required'
  | 'external-confirmation-required'
  | 'legal-review-required'
  | 'missing-artifact';

export type MoscowPilotApplicationFieldGroup =
  | 'applicant'
  | 'eligibility'
  | 'solution'
  | 'commercial'
  | 'comparison'
  | 'pilot'
  | 'attachments';

export type MoscowPilotApplicationField = {
  id: string;
  group: MoscowPilotApplicationFieldGroup;
  title: string;
  status: MoscowPilotApplicationFieldStatus;
  currentValue: string;
  requiredAction: string;
  authority: string;
  refs: string[];
};

export type MoscowPilotApplicationReadiness = {
  version: typeof MOSCOW_PILOT_APPLICATION_VERSION;
  verifiedOn: string;
  title: string;
  purpose: string;
  officialRoute: string;
  sourceRefs: string[];
  fields: MoscowPilotApplicationField[];
  guardrails: string[];
};

export const currentMoscowPilotApplicationReadiness: MoscowPilotApplicationReadiness = {
  version: MOSCOW_PILOT_APPLICATION_VERSION,
  verifiedOn: '2026-09-29',
  title: 'Moscow Pilot Application Readiness',
  purpose:
    'Перевести CITY PILOT из buyer conversation в комплект данных для заявки на статус участника пилотного тестирования инновационного решения.',
  officialRoute:
    'Заявка подаётся юридическим лицом или ИП через контур Оператора; проект не подменяет сведения заявителя и не считает статус участника присвоенным до заключения соответствующего соглашения.',
  sourceRefs: [
    'Постановление Правительства Москвы № 631-ПП в редакции от 18.03.2025',
    'Приказ ДПИР Москвы № П-18-12-113/25 от 22.04.2025',
    'i.moscow / Фонд «Московский инновационный кластер»'
  ],
  fields: [
    {
      id: 'solution-name',
      group: 'solution',
      title: 'Название инновационного решения',
      status: 'ready',
      currentValue: 'Москва во времени / городской heritage + destination platform; рабочий pilot: «Варварка во времени».',
      requiredAction: 'Перед подачей выбрать одно юридически единообразное название продукта и пилота.',
      authority: 'Project product authority',
      refs: [
        'src/government/governmentPilotOffer.ts',
        'docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md'
      ]
    },
    {
      id: 'solution-description',
      group: 'solution',
      title: 'Описание инновационного решения',
      status: 'ready',
      currentValue:
        'Повторно используемая инфраструктура: source/rights → verified heritage object → mobile journey → live destination authority → privacy-safe analytics.',
      requiredAction: 'Сжать до лимита конкретной электронной формы без изменения truth boundaries.',
      authority: 'Project product authority',
      refs: [
        'src/government/governmentPilotOffer.ts',
        'docs/MOSCOW_GOV_PILOT_POSITIONING.md'
      ]
    },
    {
      id: 'moscow-relevance',
      group: 'solution',
      title: 'Актуальность и ожидаемый эффект для Москвы',
      status: 'project-draft',
      currentValue:
        'Качественный effect case готов: единый standard цифрового heritage object, повторное использование assets, измеримый visitor journey и integration-first подход.',
      requiredAction:
        'Согласовать с city owner конкретную городскую проблему и не подставлять недоказанные количественные эффекты до baseline/pilot evidence.',
      authority: 'Project + city problem owner',
      refs: [
        'docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md',
        'docs/GOVERNMENT_PILOT_ACCEPTANCE.md'
      ]
    },
    {
      id: 'applicant-identity',
      group: 'applicant',
      title: 'Полное наименование юрлица / ИП, ИНН, КПП',
      status: 'applicant-input-required',
      currentValue: 'Не хранится в продуктовой authority.',
      requiredAction: 'Определить юридическое лицо или ИП, от имени которого подаётся заявка, и внести регистрационные реквизиты.',
      authority: 'Applicant',
      refs: []
    },
    {
      id: 'applicant-addresses',
      group: 'applicant',
      title: 'Юридический / фактический адрес',
      status: 'applicant-input-required',
      currentValue: 'Не задано.',
      requiredAction: 'Заполнить официальными сведениями заявителя.',
      authority: 'Applicant',
      refs: []
    },
    {
      id: 'applicant-contacts',
      group: 'applicant',
      title: 'Телефон, e-mail, сайт, руководитель и контактное лицо',
      status: 'applicant-input-required',
      currentValue: 'Не задано.',
      requiredAction: 'Назначить официальный applicant contact и заполнить поля формы.',
      authority: 'Applicant',
      refs: []
    },
    {
      id: 'license-requirement',
      group: 'eligibility',
      title: 'Лицензия для лицензируемого вида деятельности, если требуется',
      status: 'legal-review-required',
      currentValue: 'Применимость не определена.',
      requiredAction: 'Юридически подтвердить, требуется ли лицензия для заявленного вида деятельности/пилота.',
      authority: 'Applicant legal review',
      refs: []
    },
    {
      id: 'applicant-solvency-status',
      group: 'eligibility',
      title: 'Отсутствие ликвидации / банкротства / приостановления',
      status: 'applicant-input-required',
      currentValue: 'Нельзя определить из репозитория.',
      requiredAction: 'Подтвердить соответствие требованиям к заявителю на дату подачи.',
      authority: 'Applicant',
      refs: []
    },
    {
      id: 'ip-basis',
      group: 'eligibility',
      title: 'Права на результаты интеллектуальной деятельности',
      status: 'legal-review-required',
      currentValue:
        'Project-side IP / rights / handover matrix подготовлена, но она не заменяет applicant declaration и подтверждающие документы.',
      requiredAction:
        'Собрать цепочку прав на software, historical/3D assets и иные материалы, которые входят именно в подаваемое инновационное решение.',
      authority: 'Applicant legal + project rights authority',
      refs: [
        'docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md',
        'docs/PUBLISHED_SPATIAL_PACKAGE.md'
      ]
    },
    {
      id: 'safety-operability',
      group: 'eligibility',
      title: 'Работоспособность и безопасность решения для пилота',
      status: 'project-draft',
      currentValue:
        'Software quality gates, build checks и fail-closed authorities существуют; formal applicant assurance ещё не оформлено.',
      requiredAction:
        'Сформировать applicant assurance для конкретной pilot build, устройств, field procedure и operational boundaries.',
      authority: 'Project technical + applicant',
      refs: [
        '.github/workflows/quality.yml',
        'docs/GOVERNMENT_SECURITY_DATA_FLOW.md',
        'docs/GOVERNMENT_PILOT_TECHNICAL_SPECIFICATION.md'
      ]
    },
    {
      id: 'origin-components',
      group: 'commercial',
      title: 'Страна происхождения решения / компонентов / услуг / программного кода',
      status: 'applicant-input-required',
      currentValue: 'Cost-share по странам происхождения не рассчитан.',
      requiredAction:
        'Составить BOM/services/code-origin breakdown и доли от общей стоимости по требованиям формы.',
      authority: 'Applicant finance / procurement / engineering',
      refs: []
    },
    {
      id: 'commercialization-model',
      group: 'commercial',
      title: 'Модель коммерциализации и продвижения',
      status: 'project-draft',
      currentValue:
        'Pilot → platform/Studio license or service → object/district production → integration/support → regional onboarding; sponsorship отдельным маркированным слоем.',
      requiredAction:
        'Утвердить applicant-owned коммерческую модель и формулировку, совместимую с будущим договорным контуром.',
      authority: 'Applicant commercial',
      refs: [
        'src/government/governmentPilotOffer.ts',
        'src/government/governmentFundingPath.ts',
        'docs/GOVERNMENT_SCALE_AND_FUNDING.md'
      ]
    },
    {
      id: 'tariff-grid',
      group: 'commercial',
      title: 'Стоимость решения / тарифная сетка',
      status: 'applicant-input-required',
      currentValue:
        'Цены намеренно не придуманы до measured production economics и определения юридического продукта.',
      requiredAction:
        'Сформировать пилотный budget и applicant tariff logic отдельно от будущей district/region economics.',
      authority: 'Applicant commercial / finance',
      refs: [
        'src/government/pilotInvestmentDecision.ts',
        'docs/PILOT_INVESTMENT_DECISION.md'
      ]
    },
    {
      id: 'revenue-three-years',
      group: 'commercial',
      title: 'Фактическая выручка от реализации предлагаемого решения за 3 года',
      status: 'applicant-input-required',
      currentValue: 'Нет authoritative company financial data в репозитории.',
      requiredAction:
        'Заполнить фактическими данными заявителя; нулевые периоды указывать как факт, если это соответствует форме и реальности.',
      authority: 'Applicant finance',
      refs: []
    },
    {
      id: 'global-analogs',
      group: 'comparison',
      title: 'Аналоги в мире: технологические и экономические плюсы / минусы',
      status: 'project-draft',
      currentValue:
        'Product positioning отделяет проект от single-use AR excursions, но formal analog table для заявки ещё не собрана.',
      requiredAction:
        'Провести source-backed competitive brief и заполнить таблицу без marketing superlatives без evidence.',
      authority: 'Project research + applicant commercial',
      refs: [
        'docs/MOSCOW_GOV_PILOT_POSITIONING.md'
      ]
    },
    {
      id: 'russian-analogs',
      group: 'comparison',
      title: 'Аналоги в России: технологические и экономические плюсы / минусы',
      status: 'project-draft',
      currentValue:
        'RUSSPASS / «Узнай Москву» рассматриваются как существующие каналы для интеграции, а не как конкуренты, которых надо искусственно дискредитировать.',
      requiredAction:
        'Собрать нейтральную сравнительную таблицу по документированным функциям и экономике, если данные доступны.',
      authority: 'Project research + applicant commercial',
      refs: [
        'docs/MOSCOW_GOV_PILOT_POSITIONING.md',
        'docs/MOSCOW_LIVE_PROVIDER_STRATEGY.md'
      ]
    },
    {
      id: 'solution-comparison',
      group: 'comparison',
      title: 'Преимущества и недостатки самого инновационного решения',
      status: 'project-draft',
      currentValue:
        'Преимущества: auditable heritage authority, generic spatial pipeline, destination integration. Ограничения: external field/user/provider proof ещё не закрыт.',
      requiredAction:
        'Сохранить в заявке реальные ограничения проекта, а не подавать все слабые места как уже решённые.',
      authority: 'Project evidence authority',
      refs: [
        'src/government/governmentPilotOffer.ts',
        'src/government/pilotInvestmentDecision.ts'
      ]
    },
    {
      id: 'pilot-site',
      group: 'pilot',
      title: 'Площадка пилотного тестирования / Фонд МИК',
      status: 'external-confirmation-required',
      currentValue: 'Конкретная площадка и city owner не подтверждены.',
      requiredAction:
        'На первой официальной встрече определить pilot site и ответственного city problem owner.',
      authority: 'Moscow / pilot operator / site',
      refs: [
        'src/government/governmentPilotCollaborationCharter.ts'
      ]
    },
    {
      id: 'pilot-methodology',
      group: 'pilot',
      title: 'Методология, план-график и форма отчёта',
      status: 'ready',
      currentValue:
        'Project-side methodology, acceptance matrix, visitor protocol и final report template подготовлены.',
      requiredAction:
        'Перед пилотом пройти buyer/operator review и согласовать формальную версию.',
      authority: 'Project draft; final authority shared with pilot parties',
      refs: [
        'docs/GOVERNMENT_PILOT_TECHNICAL_SPECIFICATION.md',
        'docs/GOVERNMENT_PILOT_ACCEPTANCE.md',
        'docs/GOVERNMENT_FINAL_PILOT_REPORT_TEMPLATE.md'
      ]
    },
    {
      id: 'presentation',
      group: 'attachments',
      title: 'Презентация инновационного решения PDF/PPTX',
      status: 'missing-artifact',
      currentValue:
        'Executive one-pager и in-app demo готовы; отдельный 10–12 slide decision deck в Delivery Manifest пока отсутствует.',
      requiredAction:
        'Собрать официальный decision deck на той же evidence authority без недоказанных KPI/ROI.',
      authority: 'Project government packaging',
      refs: [
        'docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md',
        'src/government/GovernmentPartnershipDemo.tsx'
      ]
    },
    {
      id: 'ip-attachments',
      group: 'attachments',
      title: 'Документы, подтверждающие IP / законные основания использования',
      status: 'legal-review-required',
      currentValue:
        'Rights architecture описана, но конкретный комплект правоустанавливающих документов заявителя не приложен.',
      requiredAction:
        'Сформировать submission-ready legal evidence package для applicant entity.',
      authority: 'Applicant legal',
      refs: [
        'docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md'
      ]
    }
  ],
  guardrails: [
    'Application Readiness не является юридическим заключением и не подтверждает eligibility заявителя.',
    'Проект не хранит и не придумывает ИНН, КПП, адреса, выручку, тарифы или корпоративные заверения.',
    'Project-side draft не считается submitted/approved field, пока его не подтвердил applicant owner.',
    'Площадка не считается согласованной до внешнего подтверждения.',
    'Статус участника пилотного тестирования не считается присвоенным до предусмотренного официальным контуром соглашения.',
    'Готовность заявки не означает финансовую поддержку: грант/иная поддержка требует отдельного применимого отбора и решения.'
  ]
};

const SUBMISSION_READY_STATUSES = new Set<MoscowPilotApplicationFieldStatus>(['ready']);

export function evaluateMoscowPilotApplicationReadiness(
  application: MoscowPilotApplicationReadiness = currentMoscowPilotApplicationReadiness
) {
  if (application.version !== MOSCOW_PILOT_APPLICATION_VERSION) {
    throw new Error('Moscow pilot application version is invalid');
  }

  const seen = new Set<string>();
  for (const field of application.fields) {
    if (!field.id.trim()) throw new Error('Moscow pilot application field ID is missing');
    if (seen.has(field.id)) throw new Error(`Duplicate Moscow pilot application field: ${field.id}`);
    seen.add(field.id);
    if (!field.title.trim()) throw new Error(`Application field title missing: ${field.id}`);
    if (!field.currentValue.trim()) throw new Error(`Application field current value missing: ${field.id}`);
    if (!field.requiredAction.trim()) throw new Error(`Application field action missing: ${field.id}`);
    if (!field.authority.trim()) throw new Error(`Application field authority missing: ${field.id}`);
  }

  const delivery = evaluateGovernmentDeliveryReadiness({
    manifest: currentGovernmentDeliveryManifest
  });

  const byStatus = Object.fromEntries(
    [
      'ready',
      'project-draft',
      'applicant-input-required',
      'external-confirmation-required',
      'legal-review-required',
      'missing-artifact'
    ].map((status) => [
      status,
      application.fields.filter((field) => field.status === status).length
    ])
  ) as Record<MoscowPilotApplicationFieldStatus, number>;

  const blockers = application.fields
    .filter((field) => !SUBMISSION_READY_STATUSES.has(field.status))
    .map((field) => ({
      id: field.id,
      title: field.title,
      status: field.status,
      requiredAction: field.requiredAction,
      authority: field.authority,
      refs: [...field.refs]
    }));

  return {
    version: application.version,
    verifiedOn: application.verifiedOn,
    totalFields: application.fields.length,
    readyFields: byStatus.ready,
    byStatus,
    submissionReady: blockers.length === 0,
    blockers,
    fields: application.fields.map((field) => ({
      ...field,
      refs: [...field.refs]
    })),
    decisionDeckMissing:
      delivery.artifacts.find((artifact) => artifact.id === 'decision-deck')?.status !== 'ready',
    nextAction:
      'Назначить applicant owner и провести 60-минутную application working session: legal entity → IP → commercial model/tariff → revenue → origin → pilot site → analog table → attachments.'
  };
}
