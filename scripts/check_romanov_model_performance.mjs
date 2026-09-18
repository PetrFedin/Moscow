import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MODEL_DIR = path.join(ROOT, 'assets', 'models');
const MANIFEST_PATH = path.join(MODEL_DIR, 'romanov-production-candidate-v1.manifest.json');

const budgets = {
  singleGlbBytes: 5 * 1024 * 1024,
  totalRuntimePackBytes: 16 * 1024 * 1024,
  nodes: 500,
  meshes: 250,
  primitives: 500,
  triangles: 150000,
  materials: 64,
  textures: 32,
  images: 32
};

const runtimeModels = [
  'romanov-1857-documented-v1.glb',
  'romanov-1857-public-v1.glb',
  'romanov-1859-documented-v1.glb',
  'romanov-1859-public-v1.glb'
];

const candidateModels = {
  '1857': 'romanov-1857-production-candidate-v1.glb',
  '1859': 'romanov-1859-production-candidate-v1.glb'
};

function parseGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 20) throw new Error('GLB is too small');
  if (buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error('GLB magic is invalid');
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`GLB version ${version} is not supported`);
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) throw new Error(`GLB declared length ${declaredLength} != actual ${buffer.length}`);
  let offset = 12;
  let json = null;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkLength;
    if (end > buffer.length) throw new Error('GLB chunk exceeds file length');
    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(buffer.toString('utf8', start, end).replace(/\u0000+$/g, '').trim());
      break;
    }
    offset = end;
  }
  if (!json) throw new Error('GLB JSON chunk is missing');
  return { buffer, json };
}

function countTriangles(gltf) {
  const accessors = gltf.accessors ?? [];
  let triangles = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const mode = primitive.mode ?? 4;
      if (mode !== 4) continue;
      if (Number.isInteger(primitive.indices)) triangles += Math.floor((accessors[primitive.indices]?.count ?? 0) / 3);
      else if (Number.isInteger(primitive.attributes?.POSITION)) triangles += Math.floor((accessors[primitive.attributes.POSITION]?.count ?? 0) / 3);
    }
  }
  return triangles;
}

function inspectModel(filename) {
  const { buffer, json } = parseGlb(path.join(MODEL_DIR, filename));
  const primitives = (json.meshes ?? []).reduce((sum, mesh) => sum + (mesh.primitives?.length ?? 0), 0);
  const externalBuffers = (json.buffers ?? []).filter((item) => typeof item.uri === 'string').length;
  const externalImages = (json.images ?? []).filter((item) => typeof item.uri === 'string' && !item.uri.startsWith('data:')).length;
  return {
    filename, bytes: buffer.length, nodes: json.nodes?.length ?? 0, meshes: json.meshes?.length ?? 0, primitives,
    triangles: countTriangles(json), materials: json.materials?.length ?? 0, textures: json.textures?.length ?? 0,
    images: json.images?.length ?? 0, animations: json.animations?.length ?? 0, skins: json.skins?.length ?? 0,
    externalBuffers, externalImages
  };
}

function assertBudget(report) {
  const failures = [];
  const checks = [
    ['bytes', report.bytes, budgets.singleGlbBytes], ['nodes', report.nodes, budgets.nodes],
    ['meshes', report.meshes, budgets.meshes], ['primitives', report.primitives, budgets.primitives],
    ['triangles', report.triangles, budgets.triangles], ['materials', report.materials, budgets.materials],
    ['textures', report.textures, budgets.textures], ['images', report.images, budgets.images]
  ];
  for (const [name, actual, limit] of checks) if (actual > limit) failures.push(`${name} ${actual} > ${limit}`);
  if (report.animations !== 0) failures.push(`animations ${report.animations} != 0 for static heritage scene`);
  if (report.skins !== 0) failures.push(`skins ${report.skins} != 0 for static heritage scene`);
  if (report.externalBuffers !== 0) failures.push(`external buffers ${report.externalBuffers} != 0`);
  if (report.externalImages !== 0) failures.push(`external images ${report.externalImages} != 0`);
  return failures;
}

function finiteBounds(bounds) {
  return Array.isArray(bounds) && bounds.length === 2
    && bounds.every((point) => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite))
    && bounds[1].every((value, index) => value > bounds[0][index]);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const errors = [];
if (manifest.units !== 'meters') errors.push(`manifest units must be meters, got ${manifest.units}`);
const runtimeReports = runtimeModels.map(inspectModel);
const totalRuntimeBytes = runtimeReports.reduce((sum, report) => sum + report.bytes, 0);
if (totalRuntimeBytes > budgets.totalRuntimePackBytes) errors.push(`runtime pack bytes ${totalRuntimeBytes} > ${budgets.totalRuntimePackBytes}`);
for (const report of runtimeReports) for (const failure of assertBudget(report)) errors.push(`${report.filename}: ${failure}`);

for (const [era, filename] of Object.entries(candidateModels)) {
  const output = manifest.outputs?.[era];
  if (!output) { errors.push(`manifest output missing for ${era}`); continue; }
  const report = inspectModel(filename);
  if (report.bytes !== output.glb_bytes) errors.push(`${filename}: actual bytes ${report.bytes} != manifest ${output.glb_bytes}`);
  if (report.nodes !== output.geometry_nodes) errors.push(`${filename}: actual nodes ${report.nodes} != manifest geometry_nodes ${output.geometry_nodes}`);
  if (!finiteBounds(output.bounds)) errors.push(`${era}: manifest bounds are invalid`);
  for (const failure of assertBudget(report)) errors.push(`${filename}: ${failure}`);
}

console.log(JSON.stringify({ budgets, manifestUnits: manifest.units, totalRuntimeBytes, runtimeModels: runtimeReports }, null, 2));
if (errors.length > 0) {
  console.error('\nRomanov model performance gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('\nRomanov model performance gate: PASS');
