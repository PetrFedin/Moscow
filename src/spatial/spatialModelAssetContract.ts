export const HERITAGE_MOBILE_GLB_BUDGETS_V1 = {
  singleGlbBytes: 5 * 1024 * 1024,
  nodes: 500,
  meshes: 250,
  primitives: 500,
  triangles: 150000,
  materials: 64,
  textures: 32,
  images: 32
} as const;

export type SpatialModelBinaryReport = {
  schemaVersion: 1;
  format: 'glb';
  filename: string;
  sha256: string;
  bytes: number;
  glbVersion: number;
  declaredLengthMatches: boolean;
  nodes: number;
  meshes: number;
  primitives: number;
  triangles: number;
  materials: number;
  textures: number;
  images: number;
  animations: number;
  skins: number;
  externalBuffers: number;
  externalImages: number;
};

export type SpatialModelBinaryValidation = {
  valid: boolean;
  blockers: string[];
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

function integerAtLeastZero(value: number) {
  return Number.isInteger(value) && value >= 0;
}

export function validateSpatialModelBinaryReport(
  report: SpatialModelBinaryReport,
  budgets = HERITAGE_MOBILE_GLB_BUDGETS_V1
): SpatialModelBinaryValidation {
  const blockers: string[] = [];

  if (report.schemaVersion !== 1) blockers.push('binary-report-schema-invalid');
  if (report.format !== 'glb') blockers.push('binary-format-not-glb');
  if (!report.filename.trim() || !report.filename.toLowerCase().endsWith('.glb')) {
    blockers.push('binary-filename-invalid');
  }
  if (!SHA256_HEX.test(report.sha256)) blockers.push('binary-sha256-invalid');
  if (!Number.isInteger(report.bytes) || report.bytes <= 0) blockers.push('binary-size-invalid');
  if (report.glbVersion !== 2) blockers.push('glb-version-not-2');
  if (!report.declaredLengthMatches) blockers.push('glb-declared-length-mismatch');

  const counters: Array<[keyof typeof budgets, number]> = [
    ['singleGlbBytes', report.bytes],
    ['nodes', report.nodes],
    ['meshes', report.meshes],
    ['primitives', report.primitives],
    ['triangles', report.triangles],
    ['materials', report.materials],
    ['textures', report.textures],
    ['images', report.images]
  ];

  for (const [name, actual] of counters) {
    if (!integerAtLeastZero(actual)) blockers.push(`binary-counter-invalid:${name}`);
    else if (actual > budgets[name]) blockers.push(`mobile-budget-exceeded:${name}:${actual}>${budgets[name]}`);
  }

  if (!integerAtLeastZero(report.animations)) blockers.push('binary-counter-invalid:animations');
  else if (report.animations !== 0) blockers.push(`static-scene-animations-not-allowed:${report.animations}`);

  if (!integerAtLeastZero(report.skins)) blockers.push('binary-counter-invalid:skins');
  else if (report.skins !== 0) blockers.push(`static-scene-skins-not-allowed:${report.skins}`);

  if (!integerAtLeastZero(report.externalBuffers)) blockers.push('binary-counter-invalid:externalBuffers');
  else if (report.externalBuffers !== 0) blockers.push(`external-buffers-not-allowed:${report.externalBuffers}`);

  if (!integerAtLeastZero(report.externalImages)) blockers.push('binary-counter-invalid:externalImages');
  else if (report.externalImages !== 0) blockers.push(`external-images-not-allowed:${report.externalImages}`);

  return { valid: blockers.length === 0, blockers };
}

export function assertSpatialModelBinaryReport(
  report: SpatialModelBinaryReport
) {
  const validation = validateSpatialModelBinaryReport(report);
  if (!validation.valid) {
    throw new Error(`Spatial model binary report failed: ${validation.blockers.join('; ')}`);
  }
  return report;
}
