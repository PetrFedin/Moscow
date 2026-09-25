import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseGlb(buffer) {
  if (buffer.length < 20) throw new Error('GLB is too small');
  if (buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error('GLB magic is invalid');

  const glbVersion = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  let offset = 12;
  let json = null;

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkLength;

    if (end > buffer.length) throw new Error('GLB chunk exceeds file length');

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(
        buffer.toString('utf8', start, end).replace(/\u0000+$/g, '').trim()
      );
      break;
    }

    offset = end;
  }

  if (!json) throw new Error('GLB JSON chunk is missing');
  return {
    glbVersion,
    declaredLengthMatches: declaredLength === buffer.length,
    json
  };
}

function countTriangles(gltf) {
  const accessors = gltf.accessors ?? [];
  let triangles = 0;

  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const mode = primitive.mode ?? 4;
      if (mode !== 4) continue;

      if (Number.isInteger(primitive.indices)) {
        triangles += Math.floor((accessors[primitive.indices]?.count ?? 0) / 3);
      } else if (Number.isInteger(primitive.attributes?.POSITION)) {
        triangles += Math.floor((accessors[primitive.attributes.POSITION]?.count ?? 0) / 3);
      }
    }
  }

  return triangles;
}

export function buildGlbBinaryReport(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parsed = parseGlb(buffer);
  const gltf = parsed.json;
  const primitives = (gltf.meshes ?? [])
    .reduce((sum, mesh) => sum + (mesh.primitives?.length ?? 0), 0);

  return {
    schemaVersion: 1,
    format: 'glb',
    filename: path.basename(filePath),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    bytes: buffer.length,
    glbVersion: parsed.glbVersion,
    declaredLengthMatches: parsed.declaredLengthMatches,
    nodes: gltf.nodes?.length ?? 0,
    meshes: gltf.meshes?.length ?? 0,
    primitives,
    triangles: countTriangles(gltf),
    materials: gltf.materials?.length ?? 0,
    textures: gltf.textures?.length ?? 0,
    images: gltf.images?.length ?? 0,
    animations: gltf.animations?.length ?? 0,
    skins: gltf.skins?.length ?? 0,
    externalBuffers: (gltf.buffers ?? [])
      .filter((item) => typeof item.uri === 'string').length,
    externalImages: (gltf.images ?? [])
      .filter((item) => typeof item.uri === 'string' && !item.uri.startsWith('data:')).length
  };
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const requested = process.argv[2];
  if (!requested) {
    console.error('Usage: node scripts/report_glb_asset.mjs <path-to-model.glb>');
    process.exit(2);
  }

  try {
    const report = buildGlbBinaryReport(path.resolve(process.cwd(), requested));
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
