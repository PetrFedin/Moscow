import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness
} from './pilotInvestmentDecision.ts';

export const MOSCOW_INVESTOR_PROFILE_VERSION = 1 as const;

export type InvestorFieldStatus =
  | 'evidence-ready'
  | 'candidate-needs-confirmation'
  | 'owner-input-required'
  | 'pilot-evidence-required'
  | 'not-set';

export type InvestorReadinessField = {
  id: string;
  label: string;
  status: InvestorFieldStatus;
  value?: string;
  evidenceRefs: string[];
  note: string;
};

export type MoscowInvestorProfile = {
  version: typeof MOSCOW_INVESTOR_PROFILE_VERSION;
  projectName: string;
  referenceForm: {
    source: string;
    checkedAt: string;
    caveat: string;
  };
  fields: InvestorReadinessField[];
};

export const currentMoscowInvestorProfile: MoscowInvestorProfile = {
  version: MOSCOW_INVESTOR_PROFILE_VERSION,
  projectName: 'Москва во времени',
  referenceForm: {
    source: 'Official i.moscow investment expertise project form / indicative investment conclusion',
    checkedAt: '2026-09-29',
    caveat:
      'The repository uses the published official form as a preparation checklist. Actual service availability, eligibility and requested fields must be confirmed at submission time.'
  },
  fields: [
    {
      id: 'project-name',
      label: 'Наименование проекта',
      status: 'evidence-ready',
      value: 'Москва во времени',
      evidenceRefs: [
        'src/government/governmentPilotOffer.ts',
        'docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md'
      ],
      note: 'Stable project name used across the government/investor pack.'
    },
    {
      id: 'launch-date',
      label: 'Дата запуска проекта',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'Do not infer a legal/commercial launch date from repository commit history.'
    },
    {
      id: 'industry',
      label: 'Отрасль в официальной форме',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'The official form uses a closed industry list; select the current allowed category at application time rather than inventing one in code.'
    },
    {
      id: 'mvp',
      label: 'Наличие MVP',
      status: 'evidence-ready',
      value: 'Да · software MVP / pilot build',
      evidenceRefs: [
        '.github/workflows/quality.yml',
        'tests/governmentDemo.e2e.spec.ts',
        'src/MoscowApp.tsx'
      ],
      note: 'Web/iOS/Android quality proof supports MVP existence; this does not imply production deployment or city acceptance.'
    },
    {
      id: 'target-audience',
      label: 'Целевая аудитория',
      status: 'candidate-needs-confirmation',
      value: 'B2B2C',
      evidenceRefs: [
        'docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md',
        'src/government/governmentInvestorRoute.ts'
      ],
      note: 'Working investor-form mapping: city/institution/partner → visitor. Confirm the form selection with the applicant before submission.'
    },
    {
      id: 'product-configuration',
      label: 'Конфигурация продукта',
      status: 'candidate-needs-confirmation',
      value: 'Soft / App / Web',
      evidenceRefs: [
        'package.json',
        'src/MoscowApp.tsx',
        'src/MoscowDemoShell.tsx'
      ],
      note: 'Current codebase supports software, native app and web demo/QA surfaces; confirm the exact selections allowed by the current form.'
    },
    {
      id: 'sales-geography',
      label: 'География продаж',
      status: 'pilot-evidence-required',
      evidenceRefs: [],
      note: 'Moscow is the first reference market, but a commercial sales geography should not be claimed before a real contract/customer proof.'
    },
    {
      id: 'ip',
      label: 'Интеллектуальная собственность',
      status: 'evidence-ready',
      value: 'Reusable platform core + contract-defined city-specific deliverables',
      evidenceRefs: [
        'docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md',
        'docs/PUBLISHED_SPATIAL_PACKAGE.md'
      ],
      note: 'The investor narrative must preserve reusable platform IP while separately documenting commissioned Moscow-specific rights.'
    },
    {
      id: 'physical-proof',
      label: 'Technology / physical proof',
      status: 'pilot-evidence-required',
      evidenceRefs: [
        'docs/GOVERNMENT_PILOT_ACCEPTANCE.md'
      ],
      note: 'Romanov field verification and Old English Court repeatability are not complete.'
    },
    {
      id: 'visitor-proof',
      label: 'Visitor / product proof',
      status: 'pilot-evidence-required',
      evidenceRefs: [
        'docs/PILOT_OPERATIONAL_PACK.md'
      ],
      note: 'The 20–50 participant study tooling exists, but real cohort evidence is still required.'
    },
    {
      id: 'unit-economics',
      label: 'Unit economics следующего объекта/района',
      status: 'pilot-evidence-required',
      evidenceRefs: [
        'docs/PILOT_INVESTMENT_DECISION.md'
      ],
      note: 'Do not defend valuation or round size from invented unit economics.'
    },
    {
      id: 'round-size',
      label: 'Объём инвестиционного раунда',
      status: 'not-set',
      evidenceRefs: [],
      note: 'Set only after use-of-funds, runway, production capacity and measured economics are known.'
    },
    {
      id: 'post-money',
      label: 'Post-money оценка',
      status: 'not-set',
      evidenceRefs: [],
      note: 'No valuation is inferred by the product.'
    },
    {
      id: 'already-closed',
      label: 'Уже закрыто в раунде',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'Requires applicant/founder confirmation.'
    },
    {
      id: 'soft-commitments',
      label: 'Soft commitments',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'Requires applicant/founder confirmation and must not be created from informal interest.'
    },
    {
      id: 'use-of-funds',
      label: 'Использование средств',
      status: 'not-set',
      evidenceRefs: [],
      note: 'Should be built from the post-pilot scale plan: product/platform, production capacity, integrations, regional onboarding and operations.'
    },
    {
      id: 'coinvestors',
      label: 'Соинвесторы',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'List only actual named/consented investor discussions at the appropriate disclosure level.'
    },
    {
      id: 'cap-table',
      label: 'Распределение долей / cap table',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'Sensitive owner/company information; never infer from repository or product data.'
    },
    {
      id: 'previous-funding',
      label: 'Предыдущее финансирование',
      status: 'owner-input-required',
      evidenceRefs: [],
      note: 'Requires applicant/founder confirmation.'
    }
  ]
};

export function validateMoscowInvestorProfile(profile: MoscowInvestorProfile) {
  const blockers: string[] = [];

  if (profile.version !== MOSCOW_INVESTOR_PROFILE_VERSION) {
    blockers.push('investor-profile-version-invalid');
  }
  if (!profile.projectName.trim()) blockers.push('investor-profile-project-name-missing');
  if (!profile.referenceForm.source.trim()) blockers.push('investor-profile-reference-source-missing');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.referenceForm.checkedAt)) {
    blockers.push('investor-profile-reference-date-invalid');
  }
  if (!profile.referenceForm.caveat.trim()) blockers.push('investor-profile-reference-caveat-missing');

  const seen = new Set<string>();
  for (const field of profile.fields) {
    if (!field.id.trim()) blockers.push('investor-field-id-missing');
    if (seen.has(field.id)) blockers.push(`duplicate-investor-field:${field.id}`);
    seen.add(field.id);

    if (!field.label.trim()) blockers.push(`investor-field-label-missing:${field.id}`);
    if (!field.note.trim()) blockers.push(`investor-field-note-missing:${field.id}`);

    if (field.status === 'evidence-ready') {
      if (!field.value?.trim()) blockers.push(`investor-ready-field-value-missing:${field.id}`);
      if (field.evidenceRefs.length === 0) {
        blockers.push(`investor-ready-field-evidence-missing:${field.id}`);
      }
    }

    if (
      (field.status === 'owner-input-required'
        || field.status === 'pilot-evidence-required'
        || field.status === 'not-set')
      && field.value !== undefined
      && !field.value.trim()
    ) {
      blockers.push(`investor-field-empty-value:${field.id}`);
    }

    if (field.evidenceRefs.some((ref) => !ref.trim())) {
      blockers.push(`investor-field-evidence-ref-invalid:${field.id}`);
    }
  }

  return {
    valid: blockers.length === 0,
    blockers: [...new Set(blockers)]
  };
}

export function getMoscowInvestorReadiness(
  profile: MoscowInvestorProfile = currentMoscowInvestorProfile
) {
  const validation = validateMoscowInvestorProfile(profile);
  if (!validation.valid) {
    throw new Error(
      `Invalid Moscow investor profile: ${validation.blockers.join('; ')}`
    );
  }

  const investmentDecision = getPilotDecisionReadiness(currentPilotInvestmentEvidence);

  const byStatus = {
    evidenceReady: profile.fields.filter((field) => field.status === 'evidence-ready'),
    candidateNeedsConfirmation: profile.fields.filter(
      (field) => field.status === 'candidate-needs-confirmation'
    ),
    ownerInputRequired: profile.fields.filter(
      (field) => field.status === 'owner-input-required'
    ),
    pilotEvidenceRequired: profile.fields.filter(
      (field) => field.status === 'pilot-evidence-required'
    ),
    notSet: profile.fields.filter((field) => field.status === 'not-set')
  };

  const formPreparationReady =
    byStatus.ownerInputRequired.length === 0
    && byStatus.notSet.length === 0
    && byStatus.candidateNeedsConfirmation.length === 0;

  const investorReviewReady =
    formPreparationReady
    && byStatus.pilotEvidenceRequired.length === 0
    && investmentDecision.decisionPackReady;

  return {
    fieldCount: profile.fields.length,
    evidenceReadyCount: byStatus.evidenceReady.length,
    candidateNeedsConfirmationCount: byStatus.candidateNeedsConfirmation.length,
    ownerInputRequiredCount: byStatus.ownerInputRequired.length,
    pilotEvidenceRequiredCount: byStatus.pilotEvidenceRequired.length,
    notSetCount: byStatus.notSet.length,
    formPreparationReady,
    investorReviewReady,
    fields: profile.fields.map((field) => ({
      ...field,
      evidenceRefs: [...field.evidenceRefs]
    }))
  };
}
