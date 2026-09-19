import fs from 'node:fs';
import path from 'node:path';
import { romanovModelCatalog } from '../src/spatial/romanovModelCatalog.ts';

type GltfAccessor = { count?: number };
type GltfPrimitive = {
  mode?: number;
  indices?: number;
  attributes?: Record<string, number>;
};
type GltfJson = {
  asset?: { version?: string };
  accessors?: GltfAccessor[];
  meshes?: Array<{ primitives?: GltfPrimitive[] }>;
  nodes?: unknown[];
  materials?: unknown[];
  textures?: unknown[];
  images?: unknown[];
};

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

export const ROMANOV_MOBILE_PERFORMANCE_BUDGET = {
  maxFileBytes: 15 * 1024 * 1024,
  maxTriangles: 150_000,
  maxVertexReferences: 300_000,
  maxPrimitives: 120,
  maxMaterials: 32,
  maxTextures: 16
} as const;

function readGlbJson(filePath: string): GltfJson {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 20) throw new Error(`GLB too small: ${filePath}`);
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`Invalid GLB magic: ${filePath}`);
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`Unsupported GLB version ${version}: ${filePath}`);
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) throw new Error(`GLB length mismatch: ${filePath}`);

  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== JSON_CHUNK) throw new Error(`First GLB chunk is not JSON: ${filePath}`);
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').trim()) as GltfJson;
}

export function inspectGlb(filePath: string) {
  const stat = fs.statSync(filePath);
  const gltf = readGlbJson(filePath);
  const accessors = gltf.accessors ?? [];
  let triangles = 0;
  let vertexReferences = 0;
  let primitives = 0;

  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      primitives += 1;
      const mode = primitive.mode ?? 4;
      const positionAccessor = primitive.attributes?.POSITION;
      const vertexCount = positionAccessor === undefined ? 0 : (accessors[positionAccessor]?.count ?? 0);
      vertexReferences += vertexCount;
      if (mode !== 4) continue;
      if (primitive.indices !== undefined) {
        triangles += Math.floor((accessors[primitive.indices]?.count ?? 0) / 3);
      } else {
        triangles += Math.floor(vertexCount / 3);
      }
    }
  }

  return {
    fileBytes: stat.size,
    triangles,
    vertexReferences,
    primitives,
    nodes: gltf.nodes?.length ?? 0,
    meshes: gltf.meshes?.length ?? 0,
    materials: gltf.materials?.length ?? 0,
    textures: gltf.textures?.length ?? 0,
    images: gltf.images?.length ?? 0
  };
}

function violations(metrics: ReturnType<typeof inspectGlb>) {
  const budget = ROMANOV_MOBILE_PERFORMANCE_BUDGET;
  const result: string[] = [];
  if (metrics.fileBytes > budget.maxFileBytes) result.push(`fileBytes ${metrics.fileBytes} > ${budget.maxFileBytes}`);
  if (metrics.triangles > budget.maxTriangles) result.push(`triangles ${metrics.triangles} > ${budget.maxTriangles}`);
  if (metrics.vertexReferences > budget.maxVertexReferences) result.push(`vertexReferences ${metrics.vertexReferences} > ${budget.maxVertexReferences}`);
  if (metrics.primitives > budget.maxPrimitives) result.push(`primitives ${metrics.primitives} > ${budget.maxPrimitives}`);
  if (metrics.materials > budget.maxMaterials) result.push(`materials ${metrics.materials} > ${budget.maxMaterials}`);
  if (metrics.textures > budget.maxTextures) result.push(`textures ${metrics.textures} > ${budget.maxTextures}`);
  return result;
}

const report = romanovModelCatalog.map((entry) => {
  const filePath = path.resolve(entry.assetPath);
  const metrics = inspectGlb(filePath);
  return { id: entry.id, assetPath: entry.assetPath, metrics, violations: violations(metrics) };
});

console.log(JSON.stringify({
  gate: 'romanov-mobile-performance-v1',
  note: 'Internal Moscow pilot budget; not a generic ARKit/ARCore hardware guarantee.',
  budget: ROMANOV_MOBILE_PERFORMANCE_BUDGET,
  models: report
}, null, 2));

const failed = report.filter((entry) => entry.violations.length > 0);
if (failed.length > 0) {
  process.stderr.write(`Romanov mobile performance gate failed for: ${failed.map((item) => item.id).join(', ')}\n`);
  process.exit(1);
}
