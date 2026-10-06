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

const en: ExecutiveCompressedStep[] = ru.map((step) => ({ ...step }));
const zh: ExecutiveCompressedStep[] = ru.map((step) => ({ ...step }));

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
