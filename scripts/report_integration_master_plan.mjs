import {
  currentMoscowIntegrationRoadmap
} from '../src/spatial/integrationMasterPlanGate.ts';

const report = {
  planVersion: currentMoscowIntegrationRoadmap.planVersion,
  phase0: currentMoscowIntegrationRoadmap.phase0,
  nextPhase: currentMoscowIntegrationRoadmap.nextPhase,
  phases: currentMoscowIntegrationRoadmap.phases
};

console.log(JSON.stringify(report, null, 2));

if (report.phase0.status !== 'pass') {
  process.exitCode = 2;
}
