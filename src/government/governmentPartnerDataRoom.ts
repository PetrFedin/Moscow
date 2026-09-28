import {
  evaluateGovernmentDeliveryReadiness,
  type GovernmentArtifactId,
  type GovernmentDeliveryStageId
} from './governmentDeliveryManifest.ts';
import {
  governmentInvestorRoute
} from './governmentInvestorRoute.ts';
import {
  governmentFundingPath
} from './governmentFundingPath.ts';

export const GOVERNMENT_DATA_ROOM_VERSION = 1 as const;

export type GovernmentDataRoomAudience =
  | 'moscow-executive'
  | 'moscow-technical'
  | 'investor'
  | 'federal';

export type GovernmentDataRoomPackage = {
  id: GovernmentDataRoomAudience;
  title: string;
  decision: string;
  stageId: GovernmentDeliveryStageId;
  artifactIds: GovernmentArtifactId[];
  doNotClaim: string;
};

export const governmentDataRoomPackages: GovernmentDataRoomPackage[] = [
  {
    id: 'moscow-executive',
    title: 'Москва · первая официальная встреча',
    decision:
      'Согласовать профильного owner, пилотную площадку и рабочую сессию по scope / methodology / integration / acceptance.',
    stageId: 'intro-pack',
    artifactIds: [
      'executive-one-pager',
      'city-pilot-demo',
      'pilot-positioning',
      'pilot-methodology',
      'pilot-acceptance',
      'funding-scale-playbook'
    ],
    doNotClaim:
      'Не заявлять, что пилот уже доказан, бюджет одобрен или выбран конечный заказчик.'
  },
  {
    id: 'moscow-technical',
    title: 'Москва · technical / procurement working session',
    decision:
      'Согласовать технический scope, integration/data boundaries, IP/handover, operations и формальную приёмку первого этапа.',
    stageId: 'technical-pilot-approval',
    artifactIds: [
      'executive-one-pager',
      'technical-specification',
      'architecture-integration',
      'security-data-flow',
      'ip-rights-handover',
      'operations-sla',
      'pilot-acceptance'
    ],
    doNotClaim:
      'Technical-approval readiness не означает успешный pilot result или обязательство города заключить контракт.'
  },
  {
    id: 'investor',
    title: 'Инвестор · scale decision room',
    decision:
      'После physical/user proof и measured economics рассмотреть капитал для repeatable production и регионального scale.',
    stageId: 'scale-investment-decision',
    artifactIds: [
      'investment-decision-authority',
      'cost-scale-model',
      'funding-scale-playbook',
      'final-report-template'
    ],
    doNotClaim:
      'До measured economics не показывать выдуманный ROI, valuation, TAM conversion или размер раунда как доказанные.'
  },
  {
    id: 'federal',
    title: 'Регион / федерация · expansion room',
    decision:
      'После Moscow decision-ready proof и первого внешнего региона согласовать interregional proof и применимый федеральный/региональный механизм.',
    stageId: 'federal-expansion',
    artifactIds: [
      'funding-scale-playbook',
      'investment-decision-authority',
      'architecture-integration',
      'security-data-flow',
      'ip-rights-handover',
      'operations-sla'
    ],
    doNotClaim:
      'Не выдавать Moscow-only prototype за доказанную федеральную платформу и не обещать eligibility для конкретной субсидии.'
  }
];

export function buildGovernmentPartnerDataRoom() {
  const delivery = evaluateGovernmentDeliveryReadiness();
  const stageById = new Map(delivery.stages.map((stage) => [stage.id, stage]));
  const artifactById = new Map(delivery.artifacts.map((artifact) => [artifact.id, artifact]));

  const packages = governmentDataRoomPackages.map((pkg) => {
    const stage = stageById.get(pkg.stageId);
    if (!stage) throw new Error(`Government data room stage not found: ${pkg.stageId}`);

    const artifacts = pkg.artifactIds.map((artifactId) => {
      const artifact = artifactById.get(artifactId);
      if (!artifact) throw new Error(`Government data room artifact not found: ${artifactId}`);
      return {
        id: artifact.id,
        title: artifact.title,
        status: artifact.status,
        refs: [...artifact.refs],
        note: artifact.note
      };
    });

    return {
      ...pkg,
      ready: stage.ready,
      artifactBlockers: [...stage.artifactBlockers],
      evidenceBlockers: [...stage.evidenceBlockers],
      artifacts,
      readyArtifactCount: artifacts.filter((artifact) => artifact.status === 'ready').length,
      totalArtifactCount: artifacts.length
    };
  });

  return {
    version: GOVERNMENT_DATA_ROOM_VERSION,
    firstMeetingGoal: governmentInvestorRoute.firstMeetingGoal,
    fundingPrinciple: governmentFundingPath.principle,
    packages,
    currentSendablePackages: packages
      .filter((pkg) => pkg.ready)
      .map((pkg) => pkg.id),
    blockedPackages: packages
      .filter((pkg) => !pkg.ready)
      .map((pkg) => ({
        id: pkg.id,
        artifactBlockers: [...pkg.artifactBlockers],
        evidenceBlockers: [...pkg.evidenceBlockers]
      }))
  };
}
